require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const { authorize } = require('../lib/google_auth');

(async () => {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  console.log('Buscando bounce-backs de los correos de impugnacion...\n');

  const query = 'after:2026/07/05 (from:mailer-daemon OR subject:"Delivery Status" OR subject:"Undelivered" OR subject:"Returned mail")';
  const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 10 });
  const msgs = res.data.messages || [];

  if (msgs.length === 0) {
    console.log('✅ NO se encontraron bounce-backs.');
    console.log('Todos los correos de impugnacion se entregaron correctamente.');
  } else {
    console.log(`⚠ Se encontraron ${msgs.length} posibles bounce-backs:`);
    for (const m of msgs) {
      const d = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
      const getHeader = (name) => d.data.payload.headers.find(h => h.name === name)?.value || '?';
      console.log(`  ${getHeader('Date')} | ${getHeader('From')}`);
      console.log(`  ${getHeader('Subject')}`);
    }
  }

  console.log('\nCorreos enviados hoy con RECURSO:');
  const sent = await gmail.users.messages.list({ userId: 'me', q: 'after:2026/07/05 subject:RECURSO', maxResults: 10 });
  const sentMsgs = sent.data.messages || [];
  for (const m of sentMsgs) {
    const d = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['Subject', 'To'] });
    const s = d.data.payload.headers.find(h => h.name === 'Subject')?.value?.substring(0, 70);
    const t = d.data.payload.headers.find(h => h.name === 'To')?.value?.substring(0, 60);
    console.log(`  📨 ${t} | ${s}`);
  }
  console.log(sentMsgs.length > 0 ? `\n✅ ${sentMsgs.length} correos de impugnacion enviados hoy.` : '\n⚠ No se encontraron correos de impugnacion enviados.');
})();
