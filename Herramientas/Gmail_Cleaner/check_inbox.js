const { google } = require('googleapis');
const { authorize } = require('./auth');

async function checkInbox(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('📬 Revisando qué quedó en tu bandeja de entrada (INBOX)...');
  
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox',
    maxResults: 30
  });

  const messages = res.data.messages;
  if (!messages || messages.length === 0) {
    console.log('✅ ¡Tu bandeja de entrada está completamente vacía!');
    return;
  }

  console.log(`\nTienes ${messages.length} correos (mostrando los últimos).`);
  for (const message of messages) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From']
    });

    const headers = msg.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
    console.log(`- De: ${from} | Asunto: ${subject}`);
  }
}

authorize().then(checkInbox).catch(console.error);
