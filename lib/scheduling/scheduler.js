/**
 * lib/scheduler.js
 *
 * Scheduler proactivo que consulta AvailabilityStore antes de crear eventos.
 * Nunca rompe bloques protegidos. Sugiere el siguiente slot disponible si hay conflicto.
 *
 * Uso:
 *   const Scheduler = require('./lib/scheduler');
 *   Scheduler.schedule({ tipo: 'entrevista', titulo: 'Entrevista ABC', duracion: 60 });
 *   // → { creado: true, slot: '2026-07-08T17:00', disponible: true }
 */

const bus = require('../events/event_bus');
const Avail = require('../../runtime/stores/AvailabilityStore');

// Prioridades: P0 nunca se rechaza por disponibilidad
const PRIORIDADES = { P0: 0, P1: 1, P2: 2, P3: 3 };

// Bloques protegidos que el scheduler nunca debe romper
const BLOQUES_PROTEGIDOS = ['sueño', 'estudio_sena', 'estudio_cesde'];

function esProtegido(tipo) {
  return BLOQUES_PROTEGIDOS.includes(tipo);
}

function diaSemana(fecha) {
  return new Date(fecha).getDay();
}

function toHhmm(fecha) {
  return fecha.toTimeString().substring(0, 5);
}

function sumarMinutos(fecha, minutos) {
  const r = new Date(fecha);
  r.setMinutes(r.getMinutes() + minutos);
  return r;
}

/**
 * Agenda un evento respetando disponibilidad.
 *
 * @param {Object} opts
 * @param {string} opts.titulo     — nombre del evento
 * @param {number} opts.duracion   — minutos
 * @param {string} opts.prioridad  — P0|P1|P2|P3 (default P2)
 * @param {string} opts.fecha      — ISO string (opcional, si no se pasa busca el próximo slot)
 * @param {string} opts.tipo       — tipo para AvailabilityStore (ej: 'entrevista')
 * @param {Array}  opts.bloques    — bloques fijos [{ inicio: '17:00', fin: '18:00' }]
 * @returns {{ creado: boolean, slot: string|null, disponible: boolean, motivo: string }}
 */
function schedule(opts) {
  const { titulo, duracion = 60, prioridad = 'P2', fecha, tipo, bloques = [] } = opts;
  const dia = fecha ? diaSemana(fecha) : null;

  // Si es bloque protegido y no es el mismo tipo, no programar
  if (tipo && esProtegido(tipo)) {
    // Los bloques protegidos siempre van en su horario, no se mueven
    return { creado: false, slot: null, disponible: false, motivo: 'bloque_protegido_no_movible' };
  }

  // Si no hay fecha, buscar el próximo slot disponible
  if (!fecha) {
    // Probar los próximos 7 días
    for (let i = 0; i < 7; i++) {
      const probe = new Date();
      probe.setDate(probe.getDate() + i);
      probe.setHours(0, 0, 0, 0);
      const d = probe.getDay();

      const sugerencia = Avail.sugerirProximoSlot(d, duracion);
      if (sugerencia) {
        const [h, m] = sugerencia.inicio.split(':').map(Number);
        probe.setHours(h, m, 0, 0);
        return {
          creado: true,
          slot: probe.toISOString(),
          disponible: true,
          sugerido: true,
          motivo: `slot_libre_${sugerencia.inicio}-${sugerencia.fin}`
        };
      }
    }
    return { creado: false, slot: null, disponible: false, motivo: 'sin_disponibilidad_7_dias' };
  }

  // Fecha específica: verificar disponibilidad
  const horaInicio = toHhmm(new Date(fecha));
  const horaFin = toHhmm(sumarMinutos(new Date(fecha), duracion));

  // Verificar bloques fijos (protegidos)
  for (const b of bloques) {
    if (horaInicio < b.fin && horaFin > b.inicio) {
      return { creado: false, slot: new Date(fecha).toISOString(), disponible: false, motivo: 'conflicto_bloque_protegido' };
    }
  }

  // Verificar AvailabilityStore
  if (dia !== null && !Avail.estaDisponible(dia, horaInicio, horaFin)) {
    // P0 fuerza aunque haya conflicto
    if (prioridad === 'P0') {
      return { creado: true, slot: new Date(fecha).toISOString(), disponible: false, forzado: true, motivo: 'P0_forzado_sobre_disponibilidad' };
    }
    // Buscar siguiente slot ese mismo día
    const sugerencia = Avail.sugerirProximoSlot(dia, duracion, horaInicio);
    if (sugerencia) {
      const [h, m] = sugerencia.inicio.split(':').map(Number);
      const newDate = new Date(fecha);
      newDate.setHours(h, m, 0, 0);
      return {
        creado: true,
        slot: newDate.toISOString(),
        disponible: true,
        ajustado: true,
        motivo: 'movido_a_' + sugerencia.inicio + '_por_conflicto'
      };
    }
    return { creado: false, slot: new Date(fecha).toISOString(), disponible: false, motivo: 'sin_disponibilidad_en_fecha' };
  }

  return { creado: true, slot: new Date(fecha).toISOString(), disponible: true, motivo: 'ok' };
}

function scheduleAndEmit(opts) {
  const r = schedule(opts);
  if (r.creado && !r.forzado) bus.emit('event.scheduled', { titulo: opts.titulo, slot: r.slot, motivo: r.motivo });
  if (!r.disponible && !r.forzado) bus.emit('scheduler.conflict', { titulo: opts.titulo, slot: r.slot, sugerencia: r.motivo });
  return r;
}

module.exports = { schedule, scheduleAndEmit, esProtegido };
