/**
 * scripts/jobs/check_job_responses.js
 *
 * Revisa Gmail buscando respuestas a aplicaciones de trabajo.
 * Detecta: llamadas a entrevista, rechazos, solicitudes de info.
 * Envia alerta a Telegram con el contenido relevante.
 *
 * Uso: node scripts/jobs/check_job_responses.js
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const path = require('node:path');
const fs   = require('node:fs');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const BASE_DIR       = path.resolve(__dirname, '..', '..');

// ── Palabras clave para detectar respuesta de oferta laboral ─────────────────
const KEYWORDS_POSITIVOS = [
  'entrevista', 'interview', 'citaci', 'nos gustaria contactarte',
  'tu perfil', 'hoja de vida fue seleccionada', 'te invitamos',
  'proceso de seleccion', 'agenda', 'reunión', 'videollamada',
  'llamada', 'prueba tecnica', 'prueba de conocimientos', 'evaluacion'
];
const KEYWORDS_NEUTROS = [
  'postulacion recibida', 'hemos recibido tu', 'gracias por aplicar',
  'computrabajo', 'tu candidatura', 'hoja de vida'
];
const KEYWORDS_NEGATIVOS = [
  'lamentamos', 'no fuiste seleccionado', 'no cumple', 'no continuas',
  'descartado', 'no avanzaras', 'en esta ocasion no'
];

function log(msg) { console.log(`[JobMail] ${msg}`); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) { log('Telegram no configurado'); return; }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
  }).catch(e => log(`Telegram error: ${e.message}`));
}

async function getGmailClient() {
  // Intentar con credenciales OAuth2 guardadas
  const tokenPath = path.join(BASE_DIR, 'data', 'auth', 'gmail_token.json');
  const credPath  = path.join(BASE_DIR, 'data', 'auth', 'gmail_credentials.json');

  if (!fs.existsSync(credPath)) {
    log('\u26A0 gmail_credentials.json no encontrado — omitiendo check de correos');
    return null;
  }

  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const oAuth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(tokenPath)) {
    log('\u26A0 Token Gmail no encontrado — omitiendo check de correos');
    return null;
  }

  oAuth2.setCredentials(JSON.parse(fs.readFileSync(tokenPath, 'utf8')));
  return google.gmail({ version: 'v1', auth: oAuth2 });
}

function clasificar(asunto, cuerpo) {
  const texto = (asunto + ' ' + cuerpo).toLowerCase();
  if (KEYWORDS_POSITIVOS.some(k => texto.includes(k))) return 'POSITIVO';
  if (KEYWORDS_NEGATIVOS.some(k => texto.includes(k))) return 'NEGATIVO';
  if (KEYWORDS_NEUTROS.some(k => texto.includes(k))) return 'NEUTRO';
  return null;
}

function decodeBody(payload) {
  const parts = payload.parts || [payload];
  for (const p of parts) {
    if (p.mimeType === 'text/plain' && p.body?.data) {
      return Buffer.from(p.body.data, 'base64').toString('utf8').substring(0, 800);
    }
  }
  return '';
}

async function main() {
  log('\u{1F4E7} Revisando correos de respuestas laborales...');

  const gmail = await getGmailClient();
  if (!gmail) { log('Gmail no disponible — saltando'); return; }

  // Buscar correos de las últimas 48h relacionados con trabajo
  const query = 'subject:(entrevista OR postulacion OR candidatura OR seleccion OR "hoja de vida" OR trabajo OR cargo) newer_than:2d';

  let messages;
  try {
    const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 20 });
    messages = res.data.messages || [];
  } catch (e) {
    log(`Error buscando correos: ${e.message}`);
    return;
  }

  log(`Correos encontrados: ${messages.length}`);
  if (messages.length === 0) { log('Sin correos laborales recientes'); return; }

  const alertas = [];

  for (const m of messages) {
    try {
      const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const headers = msg.data.payload.headers;
      const asunto  = headers.find(h => h.name === 'Subject')?.value || '';
      const de      = headers.find(h => h.name === 'From')?.value || '';
      const cuerpo  = decodeBody(msg.data.payload);

      const tipo = clasificar(asunto, cuerpo);
      if (!tipo) continue;

      alertas.push({ tipo, asunto, de, cuerpo: cuerpo.substring(0, 300) });
      log(`  [${tipo}] De: ${de.substring(0, 40)} | Asunto: ${asunto.substring(0, 60)}`);
    } catch {}
  }

  if (alertas.length === 0) {
    log('Sin respuestas laborales relevantes');
    return;
  }

  // Iconos por tipo
  const icono = { POSITIVO: '\u{1F7E2}', NEGATIVO: '\u{1F534}', NEUTRO: '\u{1F7E1}' };

  for (const a of alertas) {
    const msg = `${icono[a.tipo]} <b>Respuesta Laboral [${a.tipo}]</b>\n` +
      `<b>De:</b> ${a.de.substring(0, 60)}\n` +
      `<b>Asunto:</b> ${a.asunto.substring(0, 80)}\n\n` +
      `<i>${a.cuerpo.substring(0, 250).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>`;
    await sendTelegram(msg);
    await new Promise(r => setTimeout(r, 500));
  }

  log(`\u2705 ${alertas.length} alerta(s) enviada(s) a Telegram`);
}

main().catch(e => { log(`ERROR: ${e.message}`); process.exit(0); /* no bloquear pipeline */ });
