const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');
const fs = require('fs');
const path = require('path');

const MSG_ID = '19f0469db90d10b6'; // Respuesta a PQRSDF AI26061318186333

async function main() {
  const auth = await authorize(['https://www.googleapis.com/auth/gmail.readonly']);
  const gmail = google.gmail({ version: 'v1', auth });

  const detail = await gmail.users.messages.get({ userId: 'me', id: MSG_ID, format: 'full' });

  // find attachment
  const parts = detail.data.payload.parts || [];
  for (const p of parts) {
    if (p.filename && p.body?.attachmentId) {
      console.log(`Descargando adjunto: ${p.filename} (${p.mimeType}, ${p.body.size} bytes)`);
      const att = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: MSG_ID,
        id: p.body.attachmentId,
      });
      const data = Buffer.from(att.data.data, 'base64');
      const outPath = path.join(__dirname, '..', 'respuesta_itagui_c14.pdf');
      fs.writeFileSync(outPath, data);
      console.log(`Guardado en: ${outPath}`);
    }
  }

  // also check sub-parts
  for (const p of parts) {
    if (p.parts) {
      for (const sp of p.parts) {
        if (sp.filename && sp.body?.attachmentId) {
          console.log(`Descargando adjunto: ${sp.filename} (${sp.mimeType}, ${sp.body.size} bytes)`);
          const att = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: MSG_ID,
            id: sp.body.attachmentId,
          });
          const data = Buffer.from(att.data.data, 'base64');
          const outPath = path.join(__dirname, '..', sp.filename);
          fs.writeFileSync(outPath, data);
          console.log(`Guardado en: ${outPath}`);
        }
      }
    }
  }

  console.log('✅ Descarga completada');
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
