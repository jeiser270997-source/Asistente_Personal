require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const { authorize: googleAuthorize } = require('../lib/integrations/google_auth');

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(BASE_DIR, 'data', 'documentos');
const INDEX_FILE = path.join(DOCS_DIR, 'indice.json');
const LOG_FILE = path.join(BASE_DIR, 'logs', 'attachment_downloader.log');

const IMPORTANT_SENDERS = [
  'fiscalia', 'dian', 'simit', 'fcm.org.co', 'transitoitagui',
  'itagui.gov.co', 'sena', 'cesde', 'mineducacion', 'hacienda',
  'medellin.gov.co', 'secretaria', 'notificaciones',
  'angelina rojas', 'angelinarojas'
];

const IMPORTANT_SUBJECTS = [
  'comparendo', 'multa', 'resolucion', 'notificacion', 'citacion',
  'certificado', 'derecho de peticion', 'respuesta', 'embargo',
  'conciliacion', 'fallo', 'sentencia', 'requerimiento',
  'convalidacion', 'matricula', 'beca', 'contrato'
];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {}
}

function isImportant(from, subject) {
  const txt = `${from} ${subject}`.toLowerCase();
  const senderMatch = IMPORTANT_SENDERS.some(s => txt.includes(s));
  const subjectMatch = IMPORTANT_SUBJECTS.some(s => txt.includes(s));
  return senderMatch || subjectMatch;
}

function loadIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {}
  return [];
}

function saveIndex(data) {
  const dir = path.dirname(INDEX_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  log('🚀 Iniciando descarga de adjuntos de emails importantes...');
  const auth = await googleAuthorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const q = 'in:inbox has:attachment newer_than:14d';
  log(`📬 Query: ${q}`);

  const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 50 });
  const messages = res.data.messages || [];
  log(`📬 ${messages.length} emails con adjuntos encontrados (14 días)`);

  const index = loadIndex();
  const processed = new Set(index.map(e => e.messageId));
  const nuevos = [];

  for (const ref of messages) {
    if (processed.has(ref.id)) continue;

    try {
      const detail = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'full'
      });

      const headers = detail.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '?';
      const subject = headers.find(h => h.name === 'Subject')?.value || '?';
      const date = headers.find(h => h.name === 'Date')?.value || '?';

      if (!isImportant(from, subject)) {
        log(`⏭️ No importante: ${subject.substring(0, 60)}`);
        continue;
      }

      const parts = [];
      function walk(part) {
        if (part.parts) part.parts.forEach(walk);
        else if (part.filename && part.body?.attachmentId) parts.push(part);
      }
      walk(detail.data.payload);

      if (parts.length === 0) {
        log(`📎 Sin adjuntos descargables: ${subject.substring(0, 50)}`);
        continue;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const emailDir = path.join(DOCS_DIR, dateStr, ref.id.substring(0, 12));
      if (!fs.existsSync(emailDir)) fs.mkdirSync(emailDir, { recursive: true });

      const files = [];
      for (const part of parts) {
        const att = await gmail.users.messages.attachments.get({
          userId: 'me', messageId: ref.id, id: part.body.attachmentId
        });
        const data = Buffer.from(att.data.data, 'base64');
        const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(emailDir, safeName);
        fs.writeFileSync(filePath, data);
        files.push({ name: safeName, size: data.length, path: filePath });
        log(`💾 Guardado: ${safeName} (${(data.length / 1024).toFixed(1)} KB)`);
      }

      const entry = {
        messageId: ref.id,
        from, subject, date,
        dir: emailDir,
        files,
        downloadedAt: new Date().toISOString()
      };
      index.push(entry);
      nuevos.push(entry);

      log(`✅ ${files.length} adjuntos de: ${subject.substring(0, 60)}`);
    } catch (e) {
      log(`❌ Error con mensaje ${ref.id}: ${e.message}`);
    }
  }

  saveIndex(index);
  log(`🏁 Terminado. ${nuevos.length} emails nuevos procesados.`);
  return { nuevos, total: index.length };
}

if (require.main === module) {
  main().catch(e => { log(`💥 FATAL: ${e.message}`); process.exit(1); });
}

module.exports = { main };
