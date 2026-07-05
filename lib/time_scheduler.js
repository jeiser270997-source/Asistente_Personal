require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const PEAK_SLOTS = [
  { start: 20, end: 23 },  // 8 PM – 11 PM Colombia
  { start: 1,  end: 5  }   // 1 AM – 5 AM Colombia
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
  const valley = isDeepSeekValley();
  if (valley) return `VALLE 🟢 (${hour}h, DeepSeek directo habilitado)`;
  return `PICO 🔴 (${hour}h, DeepSeek deshabilitado — usando gratis)`;
}

module.exports = { getColombiaHour, isDeepSeekValley, getScheduleLabel, PEAK_SLOTS };
