/**
 * context_engine_daily.js
 *
 * Se ejecuta 1 vez al día. Toma los correos importantes de las últimas 24h
 * (los que sobrevivieron al Rule Engine), los envía en lote al LLM para
 * extraer cambios de contexto, y actualiza CaseStore + Ledger.
 *
 * Flujo:
 *   1. Cargar correos importantes desde el Context Queue (CheckpointStore)
 *   2. Enviar batch al LLM con prompt estructurado
 *   3. Parsear JSON de respuesta
 *   4. Actualizar CaseStore + Ledger
 *   5. Generar resumen diario → Telegram
 *
 * Uso: node scripts/context_engine_daily.js [--dry-run]
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { askLLM } = require('../../lib/ai/llm_service');

const DRY_RUN = process.argv.includes('--dry-run');

const bus = require('../../lib/events/event_bus');

const CaseStore = require('../../runtime/stores/CaseStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const RE = require('../../lib/runtime/resume_engine');

function log(msg) { console.log(`[CTX] ${msg}`); }

/**
 * Carga la cola de correos importantes desde CheckpointStore.
 * La cola es alimentada por email_processor.js cuando detecta
 * emails con action.notify === true o action.logToLedger === true.
 */
function loadContextQueue() {
  const queue = CheckpointStore.get('context_queue');
  if (!queue || !Array.isArray(queue)) return [];
  log(`Context Queue: ${queue.length} emails`);
  return queue;
}

function clearContextQueue() {
  CheckpointStore.set('context_queue', []);
}

function pushToContextQueue(email) {
  const queue = CheckpointStore.get('context_queue') || [];
  queue.push(email);
  if (queue.length > 100) queue.splice(0, queue.length - 100);
  CheckpointStore.set('context_queue', queue);
}

/**
 * Envía el lote al LLM con un prompt estructurado.
 * El LLM devuelve JSON con los cambios detectados.
 */
async function analyzeBatch(emails) {
  if (emails.length === 0) return { cambios: [], resumen: 'Sin correos importantes en las ultimas 24h.' };

  const prompt = `Eres un asistente de contexto personal. Analiza estos correos y extrae los cambios importantes para la vida del usuario.

Para cada correo, determina:
  - Es un PROCESO NUEVO? (nueva multa, postulación, trámite)
  - Es una ACTUALIZACIÓN de un proceso existente? (entrevista, respuesta, vencimiento)
  - Es una ALERTA? (pago pendiente, fecha límite)
  - Es INFORMATIVO? (factura, newsletter, notificación)

Responde SOLO con JSON válido:
{
  "cambios": [
    {
      "tipo": "proceso_nuevo|actualizacion|alerta|informativo",
      "categoria": "legal|empleo|estudio|finanzas|gobierno|otro",
      "titulo": "nombre corto del proceso",
      "descripcion": "que paso",
      "estado": "estado actual",
      "accion_requerida": true/false,
      "prioridad": 0-3,
      "fecha_limite": "YYYY-MM-DD o null",
      "entidad": "quien envio"
    }
  ],
  "resumen": "parrafo corto con los cambios mas importantes del dia"
}

CORREOS:
${emails.map((e, i) => `[${i + 1}] De: ${e.from || '?'} | Asunto: ${e.subject || '?'} | ${e.snippet || e.body || ''}`.substring(0, 500)).join('\n\n')}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (e) {
    log('LLM error: ' + e.message);
    return { cambios: [], resumen: 'Error al analizar correos.' };
  }
}

/**
 * Aplica los cambios detectados al CaseStore.
 */
function applyCambios(cambios) {
  if (!cambios.length) return 0;

  let count = 0;
  for (const c of cambios) {
    const caseId = `ctx_${c.categoria}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (c.tipo === 'proceso_nuevo') {
      CaseStore.create({
        id: caseId,
        tipo: c.categoria,
        estado: c.estado || 'abierto',
        titulo: c.titulo,
        descripcion: c.descripcion,
        data: { entidad: c.entidad, fecha_limite: c.fecha_limite, accion_requerida: c.accion_requerida },
        prioridad: c.prioridad ?? 2,
      });
      CaseStore.addEvent(caseId, 'creacion', `Nuevo: ${c.titulo}`, c);
      bus.emit('case.created', { id: caseId, tipo: c.categoria, titulo: c.titulo, estado: c.estado, prioridad: c.prioridad });
      log(`  Nuevo caso: ${c.categoria}/${c.titulo} [${c.estado}]`);
      count++;

    } else if (c.tipo === 'actualizacion') {
      // Buscar caso existente por tipo + entidad
      const existentes = CaseStore.getAll(c.categoria);
      const match = existentes.find(ex =>
        ex.titulo?.toLowerCase().includes((c.titulo || '').substring(0, 20).toLowerCase()) ||
        ex.data?.entidad?.toLowerCase() === (c.entidad || '').toLowerCase()
      );
      if (match) {
        CaseStore.update(match.id, { estado: c.estado, data: { ...match.data, ...c, ultima_actualizacion: new Date().toISOString() } });
        CaseStore.addEvent(match.id, 'actualizacion', c.descripcion || c.titulo, c);
        bus.emit('case.updated', { id: match.id, tipo: c.categoria, estado: c.estado });
        log(`  Actualizado: ${match.titulo} → ${c.estado}`);
      } else {
        // No encontrado: crear como nuevo
        CaseStore.create({
          id: caseId, tipo: c.categoria, estado: c.estado || 'abierto',
          titulo: c.titulo, descripcion: c.descripcion,
          data: { entidad: c.entidad, fecha_limite: c.fecha_limite },
          prioridad: c.prioridad ?? 2,
        });
        log(`  Creado (no match): ${c.categoria}/${c.titulo}`);
      }
      count++;

    } else if (c.tipo === 'alerta') {
      CaseStore.create({
        id: caseId, tipo: c.categoria, estado: 'alerta',
        titulo: c.titulo, descripcion: c.descripcion,
        data: { entidad: c.entidad, fecha_limite: c.fecha_limite, accion_requerida: c.accion_requerida },
        prioridad: c.prioridad ?? 1,
      });
      log(`  Alerta: ${c.titulo}`);
      count++;
    }
  }

  return count;
}

async function main() {
  log('Context Engine Daily');

  RE.start('context_engine_daily', {});

  const queue = loadContextQueue();

  if (queue.length === 0) {
    log('Sin correos en la cola de contexto. Nada que procesar.');
    RE.finish('context_engine_daily', 'success', { processed: 0 });
    return;
  }

  log(`Analizando ${queue.length} correos via LLM...`);

  if (DRY_RUN) {
    log('[dry-run] LLM analysis skipped');
    log('[dry-run] Queue would be cleared');
    log('[dry-run] Cases would be created/updated');
    RE.finish('context_engine_daily', 'success', { dry_run: true, queue_size: queue.length });
    return;
  }

  const result = await analyzeBatch(queue);

  log(`Cambios detectados: ${result.cambios.length}`);
  log(`Resumen: ${result.resumen}`);

  if (result.cambios.length > 0) {
    const creados = applyCambios(result.cambios);
    log(`${creados} casos creados/actualizados`);

    LedgerStore.emit('context_daily', {
      emails_analizados: queue.length,
      cambios_detectados: result.cambios.length,
      resumen: result.resumen,
    });
  }

  // Limpiar cola
  clearContextQueue();
  log('Context Queue cleared');

  RE.finish('context_engine_daily', 'success', {
    queue_size: queue.length,
    cambios: result.cambios?.length || 0,
  });

  log(`Resumen: ${result.resumen}`);
  bus.emit('context.daily', { emails: queue.length, cambios: result.cambios?.length || 0, resumen: result.resumen });
  log('Context Engine Daily completado');
}

main().catch(e => {
  console.error(`[CTX] Error: ${e.message}`);
  RE.finish('context_engine_daily', 'error', { reason: e.message });
  process.exit(1);
});

// Exportar para integración con otros scripts
module.exports = { analyzeBatch, applyCambios, pushToContextQueue, loadContextQueue, clearContextQueue };
