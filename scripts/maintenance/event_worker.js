/**
 * scripts/maintenance/event_worker.js
 *
 * Worker de Transactional Outbox — Ejecución Síncrona de Eventos.
 *
 * Lee eventos pendientes de event_outbox, busca los handlers registrados
 * en event_registry.js, los ejecuta secuencialmente y marca resultados.
 *
 * Diseñado para la arquitectura Run & Die:
 *   - Resetea eventos 'processing' atascados (power loss recovery)
 *   - Procesa eventos en batches de 50
 *   - Retry hasta 3 intentos por evento
 *   - Eventos fallidos van a event_dlq
 *   - Housekeeping: limpia eventos completados > 72h
 *
 * Instalación en daily_routine.js:
 *   1. Después de Fase 3 (Scrapers y Empleo)
 *   2. Justo antes de Fase 6 (Briefing) — para datos 100% actualizados
 *
 * Dependencias:
 *   - runtime/stores/Database.js (getDb)
 *   - runtime/stores/OutboxStore.js
 *   - lib/events/event_bus.js (getHandlers)
 *   - lib/jobs/feedbackEngine.js (handler principal)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');

// ── Configuración ────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const CLEANUP_HOURS_OLD = 72;

// ── Inicialización ───────────────────────────────────────────────────────────

process.env.STORAGE_DRIVER = 'sqlite';
const { getDb, close } = require('../../runtime/stores/Database');
const OutboxStore = require('../../runtime/stores/OutboxStore');
const bus = require('../../lib/events/event_bus');

// Importar módulos que registran handlers en event_registry.js
// Cada módulo es responsable de llamar a bus.on() durante su inicialización
// o a través de una función connectToBus() explícita.
const feedbackEngine = require('../../lib/jobs/feedbackEngine');

// Registrar handlers de feedbackEngine
feedbackEngine.connectToBus(bus);

// ── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function log(msg) {
  console.log(`[${timestamp()}] [event-worker] ${msg}`);
}

/**
 * Obtiene todos los handlers registrados para debugging.
 */
function logRegisteredHandlers() {
  const all = bus.getAllHandlers();
  const total = Object.values(all).reduce((sum, handlers) => sum + handlers.length, 0);
  if (total > 0) {
    log(`${total} handler(s) registrados para ${Object.keys(all).length} tipo(s) de evento:`);
    for (const [type, handlers] of Object.entries(all)) {
      log(`   ${type}: ${handlers.join(', ')}`);
    }
  } else {
    log('⚠️  No hay handlers registrados — los eventos no tendrán procesamiento');
  }
}

// ── Ciclo Principal ──────────────────────────────────────────────────────────

async function main() {
  const db = getDb();
  const stats = { processed: 0, completed: 0, failed: 0, dlq: 0, stuck: 0, cleaned: 0 };

  // ── Fase 0: Resetear eventos 'processing' atascados (power loss recovery) ──
  // Si el proceso murió mientras marcaba eventos como 'processing',
  // los resetea a 'pending' para reprocesarlos.
  stats.stuck = OutboxStore.resetStuck(db);
  if (stats.stuck > 0) {
    log(`${stats.stuck} evento(s) atascados reseteados a pending (power loss recovery)`);
  }

  // ── Fase 1: Obtener eventos pendientes ──
  const events = OutboxStore.getPending(db, BATCH_SIZE);
  if (events.length === 0) {
    log('No hay eventos pendientes. Outbox vacía.');
    logRegisteredHandlers();

    // Housekeeping igual (por si hay completados viejos)
    stats.cleaned = OutboxStore.cleanCompleted(db, CLEANUP_HOURS_OLD);
    if (stats.cleaned > 0) log(`${stats.cleaned} evento(s) viejos limpiados`);

    close();
    log(`Worker finalizado. Stats: ${JSON.stringify(stats)}`);
    return;
  }

  log(`Procesando ${events.length} evento(s) pendiente(s)...`);

  // ── Fase 2: Procesar cada evento ──
  for (const event of events) {
    stats.processed++;

    // Sticky bit: marcar como processing para evitar doble procesamiento
    OutboxStore.markProcessing(db, event.eventId);

    // Buscar handlers registrados para este tipo de evento
    // (feedbackEngine.connectToBus(bus) registró handlers para job.*,
    //  modules adicionales pueden registrar sus propios handlers)
    const handlers = bus.getHandlers(event.eventType);

    if (handlers.length === 0) {
      log(`⚠️  Sin handler para ${event.eventType} — moviendo a DLQ`);
      OutboxStore.moveToDlq(db, event.eventId);
      stats.dlq++;
      continue;
    }

    // Ejecutar cada handler secuencialmente
    let hadError = false;
    for (const handler of handlers) {
      try {
        const envelope = {
          id: event.eventId,
          type: event.eventType,
          payload: event.payload,
          meta: event.meta || {},
          timestamp: event.createdAt ? new Date(event.createdAt + 'Z').getTime() : Date.now(),
        };

        // Soporte tanto para handlers síncronos como async
        const result = handler(envelope);
        if (result && typeof result.then === 'function') {
          await result.catch(err => { throw err; });
        }
      } catch (err) {
        log(`❌ Error en handler para ${event.eventType}: ${err.message}`);
        hadError = true;
      }
    }

    // Marcar resultado
    if (!hadError) {
      OutboxStore.markCompleted(db, event.eventId);
      stats.completed++;
    } else {
      const wentToDlq = OutboxStore.markFailed(db, event.eventId, 'Handler execution error');
      if (wentToDlq) {
        log(`⚠️  ${event.eventType} excedió reintentos — moviendo a DLQ`);
        OutboxStore.moveToDlq(db, event.eventId);
        stats.dlq++;
      } else {
        log(`🔄 ${event.eventType} reintentará (pendiente)`);
      }
      stats.failed++;
    }
  }

  // ── Fase 3: Housekeeping ──
  stats.cleaned = OutboxStore.cleanCompleted(db, CLEANUP_HOURS_OLD);
  if (stats.cleaned > 0) log(`${stats.cleaned} evento(s) viejos limpiados`);

  // ── Finalizar ──
  close();
  log(`Worker finalizado. Stats: ${JSON.stringify(stats)}`);
  log(`   ✅ ${stats.completed} completados | ❌ ${stats.failed} fallos | 🗑️ ${stats.dlq} DLQ`);
}

// ── EXEC ─────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error(`[${timestamp()}] [event-worker] 💥 FATAL: ${err.message}`);
  try { close(); } catch {}
  process.exit(1);
});
