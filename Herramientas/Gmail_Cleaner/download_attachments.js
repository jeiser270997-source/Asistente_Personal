const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

async function downloadAttachments(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const queries = [
    'from:comunicaciones@dian.gov.co has:attachment',
    'from:contactenossgdea@ugpp.gov.co has:attachment',
    'from:nuntius.once@fiscalia.gov.co has:attachment',
    'from:FactDigital@app.epm.co has:attachment',
    'from:facturasclarocol@claro.com.co has:attachment',
    'from:angelinarojas.1996@gmail.com has:attachment'
  ];

  const tempDir = path.join(__dirname, 'temp_attachments');
  await fs.mkdir(tempDir, { recursive: true });

  for (const q of queries) {
    console.log(`Buscando adjuntos para: ${q}`);
    const res = await gmail.users.messages.list({ userId: 'me', q: q, maxResults: 10 });
    const messages = res.data.messages;
    
    if (!messages) continue;

    for (const msg of messages) {
      const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const parts = fullMsg.data.payload.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.filename && part.body && part.body.attachmentId) {
          console.log(`  Descargando: ${part.filename}`);
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: msg.id,
            id: part.body.attachmentId
          });
          const buffer = Buffer.from(attachment.data.data, 'base64');
          const safeName = msg.id + '_' + part.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
          await fs.writeFile(path.join(tempDir, safeName), buffer);
        }
      }
    }
  }
  console.log('✅ Descarga completada en la carpeta temp_attachments/');
}

authorize().then(downloadAttachments).catch(console.error);
