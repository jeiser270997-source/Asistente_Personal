const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

const CORREOS_FILE = path.join(process.cwd(), '..', '..', 'correos.md');
const TEMP_DIR = path.join(__dirname, 'temp_attachments');

async function getImportantIds() {
  try {
    const content = await fs.readFile(CORREOS_FILE, 'utf8');
    const regex = /- \*\*ID:\*\* `([a-f0-9]+)`/g;
    const ids = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      ids.push(match[1]);
    }
    return ids;
  } catch (e) {
    console.error(`Error al leer correos.md: ${e.message}`);
    return [];
  }
}

async function downloadAttachmentsForIds(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const ids = await getImportantIds();

  if (ids.length === 0) {
    console.log('No se encontraron IDs de correos importantes.');
    return;
  }

  console.log(`📂 Creando carpeta de adjuntos: ${TEMP_DIR}`);
  await fs.mkdir(TEMP_DIR, { recursive: true });

  console.log(`📥 Procesando ${ids.length} correos para descargar adjuntos...`);

  for (const id of ids) {
    try {
      console.log(`Verificando correo ID: ${id}`);
      const fullMsg = await gmail.users.messages.get({ userId: 'me', id });
      
      const payload = fullMsg.data.payload;
      if (!payload) continue;

      // Extract parts recursively
      const attachments = [];
      function findAttachments(part) {
        if (part.filename && part.body && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            attachmentId: part.body.attachmentId
          });
        }
        if (part.parts) {
          part.parts.forEach(findAttachments);
        }
      }
      findAttachments(payload);

      if (attachments.length === 0) {
        console.log(`   (Sin adjuntos)`);
        continue;
      }

      console.log(`   Encontrados ${attachments.length} adjuntos.`);
      for (const att of attachments) {
        console.log(`   -> Descargando: ${att.filename}`);
        const res = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: id,
          id: att.attachmentId
        });

        const buffer = Buffer.from(res.data.data, 'base64');
        const dateStr = fullMsg.data.internalDate ? new Date(parseInt(fullMsg.data.internalDate)).toISOString().split('T')[0] : 'unknown';
        const safeName = `${dateStr}_${id}_${att.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(TEMP_DIR, safeName);
        
        await fs.writeFile(filePath, buffer);
        console.log(`      Guardado: ${safeName}`);
      }
    } catch (e) {
      console.log(`   Error procesando ID ${id}: ${e.message}`);
    }
  }

  console.log('✅ Descargas de adjuntos completadas en temp_attachments/');
}

authorize().then(downloadAttachmentsForIds).catch(console.error);
