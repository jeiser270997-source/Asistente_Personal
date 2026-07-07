const { google } = require('googleapis');
const { authorize } = require('../../lib/integrations/google_auth');
const { sendTelegramMessage } = require('../../lib/integrations/telegram');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
let RE = null;
if (USE_SQLITE) {
  CheckpointStore = require('../runtime/stores/CheckpointStore');
  RE = require('../../lib/runtime/resume_engine');
}

const KEYWORDS = ['DIAN', 'UGPP', 'SIMIT', 'Transito', 'Solvo', 'Concentrix', 'CESDE', 'SENA'];

function loadProcessed() {
  if (USE_SQLITE) {
    const cp = CheckpointStore.get('inbox_sensor_processed');
    if (cp) return new Set(cp);
  }
  try {
    const path = require('path').join(__dirname, '..', 'data', 'processed_emails.json');
    return new Set(JSON.parse(require('fs').readFileSync(path, 'utf8')));
  } catch { return new Set(); }
}

function saveProcessed(ids) {
  if (USE_SQLITE) CheckpointStore.set('inbox_sensor_processed', [...ids]);
  const fs = require('fs');
  const path = require('path').join(__dirname, '..', 'data', 'processed_emails.json');
  fs.mkdirSync(require('path').dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify([...ids], null, 2));
}

function matchesKeywords(text) {
  const upper = text.toUpperCase();
  return KEYWORDS.filter(kw => upper.includes(kw.toUpperCase()));
}

function formatAlert(email) {
  return `ALERTA DE BANDEJA - LIFE OS\nDe: ${email.from}\nAsunto: ${email.subject}\nVista: ${email.snippet}\nPalabras clave: ${email.matched.join(', ')}`;
}

async function scanInbox(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const processed = loadProcessed();
  const newIds = [];

  if (USE_SQLITE) RE.start('inbox_sensor', {});

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox is:unread -category:social -category:promotions',
    maxResults: 20
  });

  const messages = res.data.messages || [];
  console.log(`Escaneando bandeja: ${messages.length} no leidos encontrados.`);

  for (const msg of messages) {
    if (processed.has(msg.id)) continue;

    const detail = await gmail.users.messages.get({
      userId: 'me', id: msg.id, format: 'full'
    });

    const headers = detail.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
    const snippet = detail.data.snippet || '';
    const fullText = `${from} ${subject} ${snippet}`;

    const matched = matchesKeywords(fullText);
    if (matched.length === 0) continue;

    console.log(`Coincidencia: ${subject} (${matched.join(', ')})`);
    await sendTelegramMessage(formatAlert({ from, subject, snippet, matched }));
    newIds.push(msg.id);
  }

  for (const id of newIds) processed.add(id);
  if (newIds.length > 0) saveProcessed(processed);
  console.log(`Sensor completado. ${newIds.length} alertas enviadas.`);

  if (USE_SQLITE) RE.finish('inbox_sensor', 'success', { alertas: newIds.length });
}

authorize().then(auth => scanInbox(auth)).catch(err => {
  console.error('Error en inbox_sensor:', err);
  process.exit(1);
});
