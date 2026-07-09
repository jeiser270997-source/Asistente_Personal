/**
 * lib/event_registry.js
 *
 * Registro central de handlers. Se auto-ejecuta al requerirlo.
 * Todos los handlers son async (el bus los ejecuta con retry).
 */
const bus = require('./event_bus');
const { sendNotification } = require('../integrations/notifications');
const { connectToBus } = require('../jobs/feedbackEngine');
let LedgerStore = null;
try { LedgerStore = require('../../runtime/stores/LedgerStore'); } catch {}

// WheelSaver skill (cargada lazy)
let wheelSaverSkill = null;
function getWheelSaverSkill() {
  if (!wheelSaverSkill) {
    try { wheelSaverSkill = require('../../skills/wheel_saver'); } catch {}
  }
  return wheelSaverSkill;
}

function init() {
  // Conectar Feedback Engine al Event Bus
  connectToBus(bus);

  bus.on('email.processed', async (ev) => {
    LedgerStore.emit('email_processed', { event_id: ev.id, from: ev.payload.from, subject: ev.payload.subject, action: ev.payload.action });
  });

  bus.on('email.important', async (ev) => {
    const message = `<b>Correo Importante</b>\nDe: ${ev.payload.from}\nAsunto: ${ev.payload.subject}\n${ev.payload.summary || ''}`;
    await sendNotification('Correo Importante', message, 'email');
  });

  bus.on('case.created', async (ev) => {
    LedgerStore.emit('case_created', { event_id: ev.id, tipo: ev.payload.tipo, titulo: ev.payload.titulo, estado: ev.payload.estado });
    if (ev.payload.prioridad === 0) {
      await sendNotification('Caso Prioritario', `Nuevo caso prioritario\n${ev.payload.tipo}: ${ev.payload.titulo}`, 'cases');
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

  // ── Notificaciones adicionales ─────────────────────────────
  bus.on('scheduler.conflict', async (ev) => {
    const message = `Conflicto de horario\nEvento: ${ev.payload.titulo}\nSlot: ${ev.payload.slot}\nSugerencia: ${ev.payload.sugerencia}`;
    await sendNotification('Conflicto de Agenda', message, 'scheduler');
  });

  bus.on('job.rejection', async (ev) => {
    const message = `Rechazo laboral\nEmpresa: ${ev.payload.empresa}\nCargo: ${ev.payload.cargo}`;
    await sendNotification('Rechazo Laboral', message, 'jobs');
  });

  // ── WheelSaver Events ─────────────────────────────────────
  bus.on('wheel_saver.search', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      const result = await skill.run({
        payload: { action: 'search', query: ev.payload.query, options: ev.payload.options },
      });
      LedgerStore.emit('wheel_saver_search', { event_id: ev.id, query: ev.payload.query, count: result.results?.length ?? 0 });
    } catch {}
  });

  bus.on('wheel_saver.stats', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      await skill.run({ payload: { action: 'stats' } });
    } catch {}
  });

  bus.on('wheel_saver.ask', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      const result = await skill.run({ payload: { action: 'ask', query: ev.payload.question } });
      LedgerStore.emit('wheel_saver_ask', { event_id: ev.id, question: ev.payload.question });
    } catch {}
  });

  bus.on('wheel_saver.server.start', async (ev) => {
    LedgerStore.emit('wheel_saver_server', { event_id: ev.id, action: 'start', port: ev.payload.port });
  });
}

init();
module.exports = { init };
