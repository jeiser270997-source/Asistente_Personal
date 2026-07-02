const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth');

const OUTPUT_FILE = path.join(process.cwd(), '..', '..', 'correos.md');

/**
 * Obtiene y procesa una lista de correos.
 */
async function fetchEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  console.log('📬 Buscando los últimos 50 correos...');
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 50,
  });

  const messages = res.data.messages;
  if (!messages || messages.length === 0) {
    console.log('No se encontraron correos.');
    return;
  }

  let markdownContent = `# 📬 Bandeja de Entrada a Limpiar\n\n`;
  markdownContent += `> Aquí están tus últimos ${messages.length} correos. Yo (la IA) puedo leer esto y decirte cuáles podemos borrar.\n\n`;

  console.log(`📥 Descargando detalles de ${messages.length} correos...`);
  
  for (const message of messages) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date']
    });

    const headers = msg.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
    const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
    const date = headers.find(h => h.name === 'Date')?.value || 'Sin Fecha';
    const snippet = msg.data.snippet;
    const id = message.id;

    markdownContent += `### ✉️ Correo: ${subject}\n`;
    markdownContent += `- **ID:** \`${id}\`\n`;
    markdownContent += `- **De:** ${from}\n`;
    markdownContent += `- **Fecha:** ${date}\n`;
    markdownContent += `- **Resumen:** ${snippet}\n\n`;
    markdownContent += `---\n\n`;
  }

  await fs.writeFile(OUTPUT_FILE, markdownContent, 'utf8');
  console.log(`\n✅ Correos guardados exitosamente en: ${OUTPUT_FILE}`);
  console.log(`Pídele a tu IA que lea el archivo y decida qué hacer con ellos.`);
}

authorize()
  .then(fetchEmails)
  .catch(console.error);
