const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs');
const path = require('path');

async function main(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:atencionalciudadano@itagui.gov.co AI26061318186333',
    maxResults: 5
  });

  if (!res.data.messages || res.data.messages.length === 0) {
    console.log('No se encontró el correo');
    return;
  }

  const msgId = res.data.messages[0].id;
  console.log('ID del correo: ' + msgId);

  const msg = await gmail.users.messages.get({ userId: 'me', id: msgId, format: 'full' });

  const outDir = path.join(process.cwd(), '..', '..', 'data', 'documentos', '2026-06-26', msgId);
  fs.mkdirSync(outDir, { recursive: true });

  let count = 0;

  async function extractParts(parts) {
    for (const part of parts) {
      if (part.filename && part.filename.length > 0 && part.body.attachmentId) {
        count++;
        const safeName = count + '_' + part.filename.replace(/[<>:"\/\\|?*]/g, '_');
        const filePath = path.join(outDir, safeName);

        console.log('Descargando: ' + part.filename + ' (' + (part.mimeType || 'unknown') + ')');

        const att = await gmail.users.messages.attachments.get({
          userId: 'me', messageId: msgId, id: part.body.attachmentId
        });

        const buff = Buffer.from(att.data.data, 'base64');
        fs.writeFileSync(filePath, buff);
        console.log('  -> Guardado: ' + filePath + ' (' + buff.length + ' bytes)');
      }
      if (part.parts) {
        await extractParts(part.parts);
      }
    }
  }

  if (msg.data.payload.parts) {
    await extractParts(msg.data.payload.parts);
  }

  let body = '';
  if (msg.data.payload.parts) {
    for (const p of msg.data.payload.parts) {
      if (p.mimeType === 'text/plain' && p.body.data) {
        body = Buffer.from(p.body.data, 'base64').toString('utf8');
        break;
      }
      if (p.parts) {
        for (const p2 of p.parts) {
          if (p2.mimeType === 'text/plain' && p2.body.data) {
            body = Buffer.from(p2.body.data, 'base64').toString('utf8');
            break;
          }
        }
      }
    }
  }
  if (body) {
    fs.writeFileSync(path.join(outDir, 'cuerpo_correo.txt'), body, 'utf8');
    console.log('Cuerpo del correo guardado');
  }

  if (count === 0) {
    console.log('No se encontraron archivos adjuntos en este correo');
    if (msg.data.payload.parts) {
      for (const p of msg.data.payload.parts) {
        console.log('Parte: mime=' + p.mimeType + ' filename=' + p.filename + ' hasAttach=' + (!!p.body.attachmentId));
        if (p.parts) {
          for (const p2 of p.parts) {
            console.log('  Subparte: mime=' + p2.mimeType + ' filename=' + p2.filename + ' hasAttach=' + (!!p2.body.attachmentId));
          }
        }
      }
    }
  } else {
    console.log('Total adjuntos descargados: ' + count);
    console.log('Directorio: ' + outDir);
  }
}
authorize().then(main).catch(console.error);
