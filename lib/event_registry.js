/**
 * lib/event_registry.js
 *
 * Registro central de handlers. Se auto-ejecuta al requerirlo.
 * Todos los handlers son async (el bus los ejecuta con retry).
 */
const bus = require('./event_bus');
const { sendTelegramMessage } = require('./telegram');
let LedgerStore = null;
try { LedgerStore = require('../runtime/stores/LedgerStore'); } catch {}

function init() {
  bus.on('email.processed', async (ev) => {
    LedgerStore.emit('email_processed', { event_id: ev.id, from: ev.payload.from, subject: ev.payload.subject, action: ev.payload.action });
  });

  bus.on('email.important', async (ev) => {
    try {
      await sendTelegramMessage(
        `Importante\nDe: ${ev.payload.from}\nAsunto: ${ev.payload.subject}\n${ev.payload.summary || ''}`
      );
    } catch {}
  });

  bus.on('case.created', async (ev) => {
    LedgerStore.emit('case_created', { event_id: ev.id, tipo: ev.payload.tipo, titulo: ev.payload.titulo, estado: ev.payload.estado });
    if (ev.payload.prioridad === 0) {
      try {
        await sendTelegramMessage(`Nuevo caso prioritario\n${ev.payload.tipo}: ${ev.payload.titulo}\nEstado: ${ev.payload.estado}`);
      } catch {}
    }
  });

  bus.on('case.updated', async (ev) => {
    LedgerStore.emit('case_updated', { event_id: ev.id, id: ev.payload.id, tipo: ev.payload.tipo, estado: ev.payload.estado });
  });

  bus.on('job.applied', async (ev) => {
    LedgerStore.emit('job_applied', { event_id: ev.id, empresa: ev.payload.empresa, cargo: ev.payload.cargo, plataforma: ev.payload.plataforma, score: ev.payload.score });
  });

  bus.on('job.rejection', async (ev) => {
    LedgerStore.emit('job_rejection', { event_id: ev.id, empresa: ev.payload.empresa, cargo: ev.payload.cargo });
  });

  bus.on('event.scheduled', async (ev) => {
    LedgerStore.emit('event_scheduled', { event_id: ev.id, titulo: ev.payload.titulo, slot: ev.payload.slot, motivo: ev.payload.motivo });
  });

  bus.on('scheduler.conflict', async (ev) => {
    LedgerStore.emit('scheduler_conflict', { event_id: ev.id, titulo: ev.payload.titulo, slot: ev.payload.slot, sugerencia: ev.payload.sugerencia });
  });

  bus.on('context.daily', async (ev) => {
    LedgerStore.emit('context_daily', { event_id: ev.id, emails: ev.payload.emails, cambios: ev.payload.cambios, resumen: ev.payload.resumen });
  });
}

init();
module.exports = { init };
