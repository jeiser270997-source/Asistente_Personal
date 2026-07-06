const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { authorize } = require('../lib/google_auth');
const { sendTelegramMessage } = require('../lib/telegram');

const LOG_FILE = path.join(__dirname, '..', 'data', 'processed_emails.json');
const KEYWORDS = ['DIAN', 'UGPP', 'SIMIT', 'Tránsito', 'Solvo', 'Concentrix', 'CESDE', 'SENA'];

function loadProcessed() {
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveProcessed(ids) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify([...ids], null, 2));
}

function matchesKeywords(text) {
  const upper = text.toUpperCase();
  return KEYWORDS.filter(kw => upper.includes(kw.toUpperCase()));
}

function formatAlert(email) {
  const header = `🚨 *ALERTA DE BANDEJA - LIFE OS*`;
  const from = `*De:* ${email.from}`;
  const subject = `*Asunto:* ${email.subject}`;
  const snippet = `*Vista:* ${email.snippet}`;
  const keywords = `*Palabras clave:* ${email.matched.join(', ')}`;
  return `${header}\n${from}\n${subject}\n${snippet}\n${keywords}`;
}

async function scanInbox(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const processed = loadProcessed();
  const newIds = [];

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox is:unread -category:social -category:promotions',
    maxResults: 20
  });

  const messages = res.data.messages || [];
  console.log(`📬 Escaneando bandeja: ${messages.length} no leídos encontrados.`);

  for (const msg of messages) {
    if (processed.has(msg.id)) continue;

    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full'
    });

    const headers = detail.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
    const snippet = detail.data.snippet || '';
    const fullText = `${from} ${subject} ${snippet}`;

    const matched = matchesKeywords(fullText);
    if (matched.length === 0) continue;

    console.log(`🔔 Coincidencia: ${subject} (${matched.join(', ')})`);
    const alertText = formatAlert({ from, subject, snippet, matched });
    await sendTelegramMessage(alertText);
    newIds.push(msg.id);
  }

  for (const id of newIds) processed.add(id);
  if (newIds.length > 0) saveProcessed(processed);
  console.log(`✅ Sensor completado. ${newIds.length} alertas enviadas.`);
}

authorize().then(scanInbox).catch(err => {
  console.error('Error en inbox_sensor:', err);
  process.exit(1);
});
