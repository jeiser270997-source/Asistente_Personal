/**
 * lib/state_snapshot.js
 *
 * Agregador de estado del sistema.
 * Jarvis usa esto como "lo que se ahora" para decidir.
 */

const CaseStore = require('../../runtime/stores/CaseStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const JobStore = require('../../runtime/stores/JobStore');
const Avail = require('../../runtime/stores/AvailabilityStore');
const AppStore = require('../../runtime/stores/ApplicationStore');

function getState() {

  const casos = CaseStore.getAll();
  const casosAbiertos = casos.filter(c => c.estado !== 'cerrado' && c.estado !== 'completado');

  // Stress signals
  const vencidos = casosAbiertos.filter(c => {
    if (c.data?.fecha_limite) return new Date(c.data.fecha_limite) < new Date();
    return false;
  }).length;

  const urgentes = casosAbiertos.filter(c => c.prioridad === 0).length;

  // Job pipeline
  const apps = AppStore.getAll();
  const aplicadas = apps.filter(a => a.estado === 'aplicada').length;
  const entrevistas = apps.filter(a => a.estado === 'entrevista').length;
  const rechazadas = apps.filter(a => a.estado === 'rechazada').length;
  const sinRespuesta = apps.filter(a => ['aplicada', 'analizado'].includes(a.estado)).length;

  // SENA progress
  const senaCases = casosAbiertos.filter(c => c.tipo === 'estudio');
  const senaPct = senaCases.reduce((s, c) => s + (c.data?.porcentaje || 0), 0) / (senaCases.length || 1);

  // Recent failures (last 24h)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentErrors = JobStore.getAll().filter(r =>
    r.status === 'error' && r.started_at >= dayAgo
  ).length;

  // Availability today
  const today = new Date().getDay();
  const slotsHoy = Avail.slotsDisponibles(today, 60);
  const horasLibres = slotsHoy.reduce((s, sl) => s + sl.libre, 0) / 60;

  return {
    timestamp: new Date().toISOString(),
    casos: {
      total: casos.length,
      abiertos: casosAbiertos.length,
      urgentes,
      vencidos,
      por_tipo: CaseStore.porTipo(),
      requieren_seguimiento: CaseStore.requierenSeguimiento().length,
    },
    empleo: {
      aplicadas,
      entrevistas,
      rechazadas,
      sin_respuesta: sinRespuesta,
      total: apps.length,
    },
    estudio: {
      casos_sena: senaCases.length,
      progreso_pct: Math.round(senaPct),
    },
    sistema: {
      errores_24h: recentErrors,
      horas_libres_hoy: Math.round(horasLibres * 10) / 10,
    },
    senales_estres: {
      alto: vencidos > 3 || urgentes > 2 || sinRespuesta > 15,
      motivo: vencidos > 3 ? `${vencidos} vencidos` : urgentes > 2 ? `${urgentes} urgentes` : sinRespuesta > 15 ? 'muchas apps sin respuesta' : null,
    },
  };
}

module.exports = { getState };
