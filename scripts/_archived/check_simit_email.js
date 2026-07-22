const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');

async function main() {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const queries = [
    'simit',
    'notificacion transito',
    'comparendo',
    'fotomulta',
    'multa transito',
    'secretaria de movilidad',
  ];

  for (const q of queries) {
    const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 5 });
    const msgs = res.data.messages || [];
    for (const m of msgs) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata' });
      const headers = detail.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '?';
      const subject = headers.find(h => h.name === 'Subject')?.value || '?';
      const date = headers.find(h => h.name === 'Date')?.value || '?';
      console.log(`[${q}] De: ${from} | Asunto: ${subject} | ${date}`);
    }
  }
  console.log('\nBusqueda completada.');
}

main().catch(err => { console.error(err); process.exit(1); });
