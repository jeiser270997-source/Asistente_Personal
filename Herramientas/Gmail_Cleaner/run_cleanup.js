const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(process.cwd(), '..', '..', 'correos.md');

const EMPLOYMENT_QUERY = [
  'from:(computrabajo.com.co OR elempleo.com OR linkedin.com OR indeed.com)',
  'OR subject:(vacante OR empleo OR oferta OR "te estamos buscando" OR "proceso de selección" OR candidat)',
  'OR (' +
    '(CV OR hoja OR vida OR perfil OR postulación)',
  '  AND (empleo OR trabajo OR vacante)',
  ')',
  'AND in:anywhere',
].join(' ');

async function cleanup(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('🧹 Iniciando limpieza de Gmail basada en queries dinámicas...');

  console.log('🗑️ 1. Buscando y borrando correos de empleo en todo Gmail...');
  let employmentDeleted = 0;
  try {
    let pageToken;
    do {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: EMPLOYMENT_QUERY,
        maxResults: 100,
        pageToken
      });

      const messages = res.data.messages || [];
      if (messages.length > 0) {
        console.log(`   Encontrados ${messages.length} correos de empleo. Borrando...`);
        for (const msg of messages) {
          try {
            await gmail.users.messages.trash({ userId: 'me', id: msg.id });
            employmentDeleted++;
          } catch (e) {
            console.log(`[Empleo ID] Error borrando ${msg.id}: ${e.message}`);
          }
        }
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  } catch (e) {
    console.error(`Error en búsqueda de empleo: ${e.message}`);
  }
  console.log(`✅ Empleo: ${employmentDeleted} correos borrados.`);

  console.log('🔄 2. Regenerando correos.md con lo que queda en la bandeja de entrada...');
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'in:inbox'
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      await fs.writeFile(OUTPUT_FILE, '# 📬 Bandeja de Entrada a Limpiar\n\n✅ ¡Bandeja de entrada vacía!');
      console.log('Bandeja de entrada vacía.');
      return;
    }

    let markdownContent = `# 📬 Bandeja de Entrada Limpia (Importantes)\n\n`;
    markdownContent += `> Aquí están los correos importantes que quedan en tu bandeja de entrada.\n\n`;

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
    console.log(`✅ correos.md actualizado correctamente en: ${OUTPUT_FILE}`);
  } catch (e) {
    console.error(`Error al regenerar correos.md: ${e.message}`);
  }
}

authorize().then(cleanup).catch(console.error);
