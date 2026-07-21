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
  if (!data && msg.payload?.parts) {
    for (const p of msg.payload.parts) {
      if (p.mimeType === 'multipart/alternative' && p.parts) {
        for (const sp of p.parts) {
          if (sp.mimeType === 'text/plain' && sp.body?.data) { data = sp.body.data; break; }
          if (sp.mimeType === 'text/html' && sp.body?.data) { data = sp.body.data; break; }
          if (sp.parts) {
            for (const ssp of sp.parts) {
              if (ssp.mimeType === 'text/plain' && ssp.body?.data) { data = ssp.body.data; break; }
            }
            if (data) break;
          }
        }
        if (data) break;
      }
    }
  }

  // look in msg.payload.parts for any parts with filename
  const attachments = [];
  if (msg.payload?.parts) {
    for (const p of msg.payload.parts) {
      if (p.filename && p.body?.attachmentId) {
        attachments.push({ filename: p.filename, mimeType: p.mimeType, attachmentId: p.body.attachmentId, size: p.body.size });
      }
    }
  }

  return {
    body: data ? Buffer.from(data, 'base64').toString('utf8') : '(sin contenido)',
    attachments
  };
}

function getHeader(headers, name) {
  const h = headers.find(x => x.name === name);
  return h ? h.value : '?';
}

const CRITICAL_IDS = [
  '19f8616c5174bd29', // Radicación HOY AI26072102803271
  '19f0469db90d10b6', // Respuesta a PQRSDF AI26061318186333 (con adjunto!)
  '19f71397ceb60b33', // Mirian Sanchez - solicita PDF
  '19f63208b899491c', // Mirian Sanchez - RV comparendo 0000430265
  '19f762864561dd25', // ENVIADO - Derecho de Petición certificado calibración
];

async function main() {
  const auth = await authorize(['https://www.googleapis.com/auth/gmail.readonly']);
  const gmail = google.gmail({ version: 'v1', auth });

  for (const id of CRITICAL_IDS) {
    const detail = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
    const h = detail.data.payload.headers;
    const subject = getHeader(h, 'Subject');
    const from = getHeader(h, 'From');
    const to = getHeader(h, 'To');
    const date = getHeader(h, 'Date');
    const { body, attachments } = decodeBody(detail.data);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`ID: ${id}`);
    console.log(`FECHA: ${date}`);
    console.log(`DE: ${from}`);
    console.log(`PARA: ${to}`);
    console.log(`ASUNTO: ${subject}`);
    if (attachments.length > 0) {
      console.log(`ADJUNTOS: ${attachments.map(a => `${a.filename} (${a.mimeType})`).join(', ')}`);
    }
    console.log(`${'='.repeat(80)}`);
    console.log(body);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('FIN');
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
