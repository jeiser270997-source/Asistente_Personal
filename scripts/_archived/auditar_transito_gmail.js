const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');

function decodeBody(msg) {
  let data = msg.payload?.body?.data;
  if (!data && msg.payload?.parts) {
    for (const p of msg.payload.parts) {
      if (p.mimeType === 'text/plain' && p.body?.data) { data = p.body.data; break; }
      if (p.parts) {
        for (const sp of p.parts) {
          if (sp.mimeType === 'text/plain' && sp.body?.data) { data = sp.body.data; break; }
        }
        if (data) break;
      }
    }
  }
  if (!data && msg.payload?.parts) {
    for (const p of msg.payload.parts) {
      if (p.mimeType === 'text/html' && p.body?.data) { data = p.body.data; break; }
    }
  }
  return data ? Buffer.from(data, 'base64').toString('utf8') : '(sin contenido)';
}

function getHeader(headers, name) {
  const h = headers.find(x => x.name === name);
  return h ? h.value : '?';
}

const SENDERS = [
  'fcm.org.co', 'simit.org.co', 'simit.gov.co',
  'itagui.gov.co', 'medellin.gov.co',
  'movilidad', 'transito',
  'angela.garcia', 'mirian.sanchez',
];

const KEYWORDS = [
  'simit', 'comparendo', 'fotomulta', 'multa', 'transito',
  'movilidad', 'infraccion', 'velocidad',
  'recurso reposicion', 'derecho peticion',
  'descargue', 'nulidad', 'impugnacion',
  'cobro coactivo', 'embargo',
  'paz y salvo', 'certificado transito',
  'kew496',
];

function matchEmail(msg) {
  const headers = msg.payload.headers;
  const from = getHeader(headers, 'From').toLowerCase();
  const subject = getHeader(headers, 'Subject').toLowerCase();
  const snippet = (msg.snippet || '').toLowerCase();
  const to = getHeader(headers, 'To').toLowerCase();
  const body = decodeBody(msg).toLowerCase();

  const haystack = `${from} ${subject} ${snippet} ${body} ${to}`;

  const matchedKeywords = KEYWORDS.filter(k => haystack.includes(k));
  const matchedSenders = SENDERS.filter(s => from.includes(s) || to.includes(s));

  return { matchedKeywords, matchedSenders };
}

async function searchGmail(gmail, query, maxResults = 30) {
  const all = [];
  let pageToken = null;
  do {
    const res = await gmail.users.messages.list({
      userId: 'me', q: query, maxResults, pageToken,
    });
    const msgs = res.data.messages || [];
    for (const m of msgs) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      all.push(detail.data);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken && all.length < 60);
  return all;
}

function printEmail(msg, label) {
  const headers = msg.payload.headers;
  const id = msg.id;
  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const subject = getHeader(headers, 'Subject');
  const date = getHeader(headers, 'Date');
  const snippet = (msg.snippet || '').slice(0, 200);

  const { matchedKeywords, matchedSenders } = matchEmail(msg);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📌 [${label}] ID: ${id}`);
  console.log(`📅 ${date}`);
  console.log(`📤 De: ${from}`);
  console.log(`📥 Para: ${to}`);
  console.log(`📧 Asunto: ${subject}`);
  console.log(`🔍 Keywords: ${matchedKeywords.join(', ') || '(ninguna)'}`);
  console.log(`👤 Sender match: ${matchedSenders.join(', ') || '(ninguno)'}`);
  console.log(`📝 Snippet: ${snippet}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function main() {
  console.log('🔐 Autenticando con Gmail API...\n');
  const auth = await authorize(['https://www.googleapis.com/auth/gmail.readonly']);
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Buscar en RECIBIDOS (inbox + all)
  console.log('\n══════════════════════════════════════════════════');
  console.log('📥 CORREOS RECIBIDOS SOBRE TRÁNSITO');
  console.log('══════════════════════════════════════════════════');

  const inboxQuery = KEYWORDS.map(k => `in:anywhere ${k}`).join(' OR ');
  const inboxResults = await searchGmail(gmail, inboxQuery, 30);

  const seen = new Set();
  for (const msg of inboxResults) {
    if (seen.has(msg.id)) continue;
    seen.add(msg.id);
    const isSent = msg.labelIds?.includes('SENT');
    printEmail(msg, isSent ? 'ENVIADO' : 'RECIBIDO');
  }

  // 2. Buscar en ENVIADOS (sent mail)
  console.log('\n\n══════════════════════════════════════════════════');
  console.log('📤 CORREOS ENVIADOS SOBRE TRÁNSITO');
  console.log('══════════════════════════════════════════════════');

  const sentQuery = `in:sent (${KEYWORDS.map(k => k).join(' OR ')})`;
  const sentResults = await searchGmail(gmail, sentQuery, 30);

  for (const msg of sentResults) {
    if (seen.has(msg.id)) continue;
    seen.add(msg.id);
    printEmail(msg, 'ENVIADO');
  }

  // 3. Buscar específicamente de contactos SIMIT
  console.log('\n\n══════════════════════════════════════════════════');
  console.log('📬 CORREOS DE CONTACTOS CONOCIDOS (FCM, ITAGÜÍ)');
  console.log('══════════════════════════════════════════════════');

  const contactQuery = [
    'from:mirian.sanchez@fcm.org.co',
    'from:comunicacionsimit@fcm.org.co',
    'from:transitoitagui@itagui.gov.co',
    'from:atencionalciudadano@itagui.gov.co',
    'from:contactosimit@fcm.org.co',
  ].join(' OR ');

  const contactResults = await searchGmail(gmail, contactQuery, 20);
  for (const msg of contactResults) {
    if (seen.has(msg.id)) continue;
    seen.add(msg.id);
    printEmail(msg, 'CONTACTO SIMIT');
  }

  console.log(`\n\n✅ Auditoría completada. Total correos únicos encontrados: ${seen.size}`);
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
