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
  return data ? Buffer.from(data, 'base64').toString('utf8') : '(sin contenido de texto plano)';
}

async function main() {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const queries = [
    'comunicacionsimit@fcm.org.co',
    'from:mirian.sanchez@fcm.org.co',
    'from:atencionalciudadano@itagui.gov.co comparendo',
    'from:angela.garcia@fcm.org.co',
  ];

  for (const q of queries) {
    const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 3 });
    for (const m of res.data.messages || []) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const h = detail.data.payload.headers;
      const subject = h.find(x => x.name === 'Subject')?.value || '?';
      const from = h.find(x => x.name === 'From')?.value || '?';
      const date = h.find(x => x.name === 'Date')?.value || '?';
      const body = decodeBody(detail.data);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`DE: ${from}`);
      console.log(`ASUNTO: ${subject}`);
      console.log(`FECHA: ${date}`);
      console.log(`${'='.repeat(60)}`);
      console.log(body.slice(0, 3000));
    }
  }

  console.log('\n\nFIN.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
