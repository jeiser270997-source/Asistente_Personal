const fs = require('node:fs');
const path = require('node:path');
const { sendTelegramMessage } = require('../lib/telegram');

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

const DEDUP_FILE = path.join(__dirname, '..', 'data', 'recordatorios_enviados.json');

function loadSent() {
  try {
    return JSON.parse(fs.readFileSync(DEDUP_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function markSent(date) {
  const sent = loadSent();
  sent.push(date);
  fs.mkdirSync(path.dirname(DEDUP_FILE), { recursive: true });
  fs.writeFileSync(DEDUP_FILE, JSON.stringify(sent, null, 2));
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
  const sent = loadSent();

  // Sends reminder at 5 PM Colombia time (1h before class)
  if (hour < 17 || hour >= 18) {
    console.log(`Not reminder time (current: ${hour}:00 Colombia). Skipping.`);
    return;
  }

  const classToday = CLASSES.find(c => c.date === today);
  if (!classToday) {
    console.log(`No class today (${today}). Skipping.`);
    return;
  }

  if (sent.includes(today)) {
    console.log(`Reminder for ${today} already sent. Skipping.`);
    return;
  }

  const label = classToday.num <= 2 ? 'Taller' : 'Clase';
  const extra = classToday.num === 9 ? ' — Asignación del taller' : '';

  const msg = `📚 <b>Recordatorio CESDE</b>\n\n` +
    `<b>${label} ${classToday.num}${extra}</b>\n` +
    `📅 ${today}\n` +
    `⏰ 6:00 PM - 8:00 PM\n` +
    `📍 <a href="${TEAMS_LINK}">Microsoft Teams</a>\n\n` +
    `🕐 Empieza en 1 hora.`;

  await sendTelegramMessage(msg);
  markSent(today);
  console.log(`✅ Reminder sent for ${today} (Class ${classToday.num})`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
