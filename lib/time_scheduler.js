const PEAK_SLOTS = [
  { start: 20, end: 23 },
  { start: 1,  end: 5  }
];

function getColombiaHour() {
  const now = new Date();
  const col = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return col.getHours();
}

function isDeepSeekValley() {
  const hour = getColombiaHour();
  for (const slot of PEAK_SLOTS) {
    if (hour >= slot.start && hour < slot.end) return false;
  }
  return true;
}

function getScheduleLabel() {
  const hour = getColombiaHour();
  if (isDeepSeekValley()) {
    return `🟢 VALLE (${hour}h COL) - DeepSeek activo`;
  }
  return `🔴 PICO (${hour}h COL) - DeepSeek pausado hasta ${hour < 5 ? '5am' : 'medianoche'}`;
}

function getNextValleyHour() {
  const hour = getColombiaHour();
  if (isDeepSeekValley()) return null;
  if (hour >= 20) return 23; // termina a las 11pm
  if (hour >= 1 && hour < 5) return 5; // termina a las 5am
  return 5; // default
}

module.exports = { getColombiaHour, isDeepSeekValley, getScheduleLabel, getNextValleyHour, PEAK_SLOTS };
