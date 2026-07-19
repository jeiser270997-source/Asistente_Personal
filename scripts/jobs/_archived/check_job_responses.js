/**
 * scripts/jobs/check_job_responses.js
 *
 * Revisa Gmail por correos importantes en las ultimas 48h:
 *   - Respuestas laborales (entrevistas, rechazos, confirmaciones)
 *   - SIMIT / Transito (multas, fotomultas, citaciones, impuestos)
 *   - DIAN (requerimientos, declaraciones, sanciones, RUT)
 *   - SENA (actividades, calificaciones, vencimientos)
 *   - Legal / cobros (juridico, demanda, embargo, coactivo)
 *   - Bancos / deudas (mora, cuota, credito vencido)
 *
 * Uso: node scripts/jobs/check_job_responses.js
 * No bloquea el pipeline: siempre exit 0.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const path = require('node:path');
const fs   = require('node:fs');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const BASE_DIR       = path.resolve(__dirname, '..', '..');
const { escapeHTML } = require('../../lib/runtime/sanitize');

// ─── Categorías con sus keywords, icono y nivel de urgencia ──────────────────
const CATEGORIAS = [
  {
    nombre: 'TRABAJO_POSITIVO',
    icono: '\u{1F7E2}',  // 🟢
    urgencia: 'ALTA',
    keywords: [
      'entrevista', 'interview', 'citaci', 'nos gustaria contactarte',
      'tu perfil fue seleccionado', 'hoja de vida fue seleccionada',
      'te invitamos', 'proceso de seleccion', 'agenda una cita',
      'reunión', 'videollamada', 'llamada', 'prueba tecnica',
      'prueba de conocimientos', 'evaluacion tecnica', 'bienvenido al proceso'
    ],
  },
  {
    nombre: 'TRABAJO_NEGATIVO',
    icono: '\u{1F534}',  // 🔴
    urgencia: 'BAJA',
    keywords: [
      'lamentamos informarte', 'no fuiste seleccionado', 'no cumple el perfil',
      'no continuas en el proceso', 'descartado', 'no avanzaras',
      'en esta ocasion no', 'no fue posible continuar'
    ],
  },
  {
    nombre: 'TRABAJO_NEUTRO',
    icono: '\u{1F7E1}',  // 🟡
    urgencia: 'BAJA',
    keywords: [
      'postulacion recibida', 'hemos recibido tu hoja de vida',
      'gracias por aplicar', 'tu candidatura', 'confirmamos tu postulacion'
    ],
  },
  {
    nombre: 'TRANSITO_SIMIT',
    icono: '\u{1F6A8}',  // 🚨
    urgencia: 'ALTA',
    keywords: [
      'simit', 'secretaria de transito', 'fotomulta', 'infraccion de transito',
      'comparendo', 'multa de transito', 'impuesto vehicular', 'soat',
      'tecnomecanica', 'revision tecnico mecanica', 'inmovilizacion',
      'citacion transito', 'proceso coactivo transito'
    ],
  },
  {
    nombre: 'DIAN',
    icono: '\u26A0\uFE0F',  // ⚠️
    urgencia: 'ALTA',
    keywords: [
      'dian', 'declaracion de renta', 'requerimiento ordinario',
      'sancion', 'proceso de cobro coactivo', 'rut', 'nit',
      'obligacion tributaria', 'iva', 'retencion en la fuente',
      'notificacion dian', 'pliego de cargos', 'resolucion sancion'
    ],
  },
  {
    nombre: 'SENA',
    icono: '\u{1F393}',  // 🎓
    urgencia: 'MEDIA',
    keywords: [
      'sena', 'sofia plus', 'zajuna', 'actividad pendiente', 'actividad vencida',
      'calificacion', 'instructor', 'formacion virtual', 'complementaria',
      'certificado sena', 'evidencia pendiente'
    ],
  },
  {
    nombre: 'LEGAL_COBRO',
    icono: '\u{1F4DC}',  // 📜
    urgencia: 'ALTA',
    keywords: [
      'proceso juridico', 'proceso coactivo', 'demanda', 'embargo',
      'mandamiento de pago', 'cobro prejuridico', 'cobro juridico',
      'notificacion judicial', 'deuda en mora', 'cartera vencida',
      'titulo ejecutivo', 'abogado externo'
    ],
  },
  {
    nombre: 'BANCO_DEUDA',
    icono: '\u{1F4B8}',  // 💸
    urgencia: 'MEDIA',
    keywords: [
      'cuota vencida', 'credito en mora', 'pago vencido', 'deuda pendiente',
      'aviso de cobro', 'obligacion financiera', 'refinanciacion',
      'datacredito', 'cifin', 'reporte negativo'
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[EmailCheck] ${msg}`); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
  }).catch(e => log(`Telegram error: ${e.message}`));
}

async function getGmailClient() {
  const tokenPath = path.join(BASE_DIR, 'data', 'auth', 'gmail_token.json');
  const credPath  = path.join(BASE_DIR, 'data', 'auth', 'gmail_credentials.json');

  if (!fs.existsSync(credPath) || !fs.existsSync(tokenPath)) {
    log('\u26A0 Credenciales Gmail no encontradas — omitiendo');
    return null;
  }

  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const oAuth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2.setCredentials(JSON.parse(fs.readFileSync(tokenPath, 'utf8')));
  return google.gmail({ version: 'v1', auth: oAuth2 });
}

function clasificar(asunto, cuerpo) {
  const texto = (asunto + ' ' + cuerpo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const cat of CATEGORIAS) {
    if (cat.keywords.some(k => texto.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return cat;
    }
  }
  return null;
}

function decodeBody(payload) {
  const tryParts = (parts) => {
    for (const p of (parts || [])) {
      if (p.mimeType === 'text/plain' && p.body?.data) {
        return Buffer.from(p.body.data, 'base64').toString('utf8');
      }
      if (p.parts) {
        const inner = tryParts(p.parts);
        if (inner) return inner;
      }
    }
    return '';
  };
  if (payload.body?.data) return Buffer.from(payload.body.data, 'base64').toString('utf8');
  return tryParts(payload.parts || []);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log('\u{1F4E7} Revisando correos importantes (48h)...');

  const gmail = await getGmailClient();
  if (!gmail) return;

  // Query amplio para capturar todas las categorias
  const query = [
    'simit', 'transito', 'dian', 'sena', 'entrevista', 'postulacion',
    'candidatura', 'juridico', 'embargo', 'coactivo', 'cuota vencida',
    'multa', 'requerimiento', 'declaracion', 'fotomulta'
  ].map(k => `"${k}"`).join(' OR ');

  let messages = [];
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `(${query}) newer_than:2d`,
      maxResults: 30,
    });
    messages = res.data.messages || [];
  } catch (e) {
    log(`Error buscando correos: ${e.message}`);
    return;
  }

  log(`Correos encontrados: ${messages.length}`);
  if (messages.length === 0) { log('Sin correos importantes recientes'); return; }

  // Rastrear IDs ya procesados (evitar alertas duplicadas)
  const seenPath = path.join(BASE_DIR, 'data', 'state', 'email_seen.json');
  const seen = new Set(fs.existsSync(seenPath) ? JSON.parse(fs.readFileSync(seenPath, 'utf8')) : []);

  const alertas = [];
  const nuevosIds = [];

  for (const m of messages) {
    if (seen.has(m.id)) continue;
    nuevosIds.push(m.id);
    try {
      const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const headers = msg.data.payload.headers;
      const asunto  = headers.find(h => h.name === 'Subject')?.value || '';
      const de      = headers.find(h => h.name === 'From')?.value || '';
      const fecha   = headers.find(h => h.name === 'Date')?.value || '';
      const cuerpo  = decodeBody(msg.data.payload).substring(0, 600);

      const cat = clasificar(asunto, cuerpo);
      if (!cat) continue;

      alertas.push({ cat, asunto, de, fecha, cuerpo: cuerpo.substring(0, 300) });
      log(`  [${cat.nombre}][${cat.urgencia}] ${asunto.substring(0, 60)}`);
    } catch (e) {
      log(`  Error leyendo msg ${m.id}: ${e.message.substring(0, 50)}`);
    }
  }

  // Guardar IDs vistos
  if (nuevosIds.length > 0) {
    const allSeen = [...seen, ...nuevosIds].slice(-500); // max 500
    fs.mkdirSync(path.dirname(seenPath), { recursive: true });
    fs.writeFileSync(seenPath, JSON.stringify(allSeen));
  }

  if (alertas.length === 0) {
    log('Sin alertas nuevas');
    return;
  }

  // Ordenar por urgencia
  const orden = { ALTA: 0, MEDIA: 1, BAJA: 2 };
  alertas.sort((a, b) => orden[a.cat.urgencia] - orden[b.cat.urgencia]);

  for (const a of alertas) {
    const txt =
      `${a.cat.icono} <b>[${a.cat.nombre}] ${a.cat.urgencia}</b>\n` +
      `<b>De:</b> ${escapeHTML(a.de).substring(0, 70)}\n` +
      `<b>Asunto:</b> ${escapeHTML(a.asunto).substring(0, 100)}\n\n` +
      `<i>${a.cuerpo.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 280)}</i>`;
    await sendTelegram(txt);
    await new Promise(r => setTimeout(r, 600));
  }

  log(`\u2705 ${alertas.length} alerta(s) enviada(s) (${alertas.map(a => a.cat.nombre).join(', ')})`);
}

main().catch(e => { log(`ERROR: ${e.message}`); process.exit(0); });
