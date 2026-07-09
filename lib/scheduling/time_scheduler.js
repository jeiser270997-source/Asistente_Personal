/**
 * lib/scheduling/time_scheduler.js
 *
 * Utilidades de horario Colombia.
 * DeepSeek valley/pico scheduling eliminado — ya no usamos DeepSeek.
 */

function getColombiaHour() {
  const now = new Date();
  const col = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return col.getHours();
}

function getScheduleLabel() {
  const hour = getColombiaHour();
  return `🕐 ${hour}h COL`;
}

module.exports = { getColombiaHour, getScheduleLabel };
