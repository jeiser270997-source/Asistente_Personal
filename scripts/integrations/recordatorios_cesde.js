const { sendNotification } = require('../../lib/integrations/notifications');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
}

const TEAMS_LINK = 'https://teams.microsoft.com/meet/280288227682235?p=ozE7zsdkk2B1OSSd9w';

const CLASSES = [
  { date: '2026-07-06', num: 3 },
  { date: '2026-07-08', num: 4 },
  { date: '2026-07-10', num: 5 },
  { date: '2026-07-15', num: 6 },
  { date: '2026-07-17', num: 7 },
  { date: '2026-07-22', num: 8 },
  { date: '2026-07-24', num: 9 },
];

function loadSentJson() {
  try {
    const path = require('path').join(__dirname, '..', 'data', 'recordatorios_enviados.json');
    return JSON.parse(require('fs').readFileSync(path, 'utf8'));
  } catch { return []; }
}

function saveSentJson(dates) {
  const fs = require('fs');
  const path = require('path').join(__dirname, '..', 'data', 'recordatorios_enviados.json');
  fs.mkdirSync(require('path').dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(dates, null, 2));
}

function loadSent() {
  if (USE_SQLITE) {
    const cp = CheckpointStore.get('recordatorios_cesde');
    return cp || [];
  }
  return loadSentJson();
}

function markSent(date) {
  const sent = loadSent();
  sent.push(date);
  if (USE_SQLITE) {
    CheckpointStore.set('recordatorios_cesde', sent);
  } else {
    saveSentJson(sent);
  }
}

function getColombiaDate() {
  const now = new Date();
  const colOpts = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('en-CA', colOpts).formatToParts(now);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

function getColombiaHour() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false });
}

async function main() {
  const today = getColombiaDate();
  const hour = parseInt(getColombiaHour(), 10);

  if (hour < 17 || hour >= 18) {
    console.log(`Not reminder time (current: ${hour}:00 Colombia). Skipping.`);
    return;
  }

  const classToday = CLASSES.find(c => c.date === today);
  if (!classToday) {
    console.log(`No class today (${today}). Skipping.`);
    return;
  }

  const sent = loadSent();
  if (Array.isArray(sent) && sent.includes(today)) {
    console.log(`Reminder for ${today} already sent. Skipping.`);
    return;
  }

  const label = classToday.num <= 2 ? 'Taller' : 'Clase';
  const extra = classToday.num === 9 ? ' — Asignacion del taller' : '';

  const msg = `<b>Recordatorio CESDE</b>\n\n` +
    `<b>${label} ${classToday.num}${extra}</b>\n` +
    `${today}\n` +
    `6:00 PM - 8:00 PM\n` +
    `<a href="${TEAMS_LINK}">Microsoft Teams</a>\n\n` +
    `Empieza en 1 hora.`;

  await sendNotification('Recordatorio CESDE', msg.replace(/<\/?b>/g, '*'));
  markSent(today);
  console.log(`Reminder sent for ${today} (Class ${classToday.num})`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
