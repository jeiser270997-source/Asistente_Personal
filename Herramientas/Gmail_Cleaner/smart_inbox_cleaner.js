const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(process.cwd(), '..', '..', 'correos.md');
const rules = require('./cleaner_config.json');

function shouldTrash(from, subject) {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();

  for (const rule of rules) {
    const fromMatch = !rule.fromPatterns || rule.fromPatterns.some(p => fromLower.includes(p));
    const subjectMatch = !rule.subjectPatterns || rule.subjectPatterns.some(p => subjectLower.includes(p));
    if (fromMatch && subjectMatch) {
      return { trash: true, reason: rule.reason };
    }
  }

  return { trash: false };
}

async function cleanInbox(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('🧹 Iniciando escaneo inteligente de la bandeja de entrada (INBOX)...');

  let pageToken = undefined;
  let totalScanned = 0;
  let totalTrashed = 0;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 100,
      pageToken
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      break;
    }

    console.log(`🔍 Analizando lote de ${messages.length} correos...`);

    for (const message of messages) {
      totalScanned++;
      try {
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

        const decision = shouldTrash(from, subject);
        if (decision.trash) {
          console.log(`   🗑️ BORRANDO: [${decision.reason}] | De: ${from} | Asunto: ${subject}`);
          await gmail.users.messages.trash({ userId: 'me', id: message.id });
          totalTrashed++;
        }
      } catch (e) {
        console.log(`   Error procesando mensaje ${message.id}: ${e.message}`);
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`\n========================================================`);
  console.log(`✅ ESCANEO FINALIZADO`);
  console.log(`Total escaneados en INBOX: ${totalScanned}`);
  console.log(`Total eliminados (basura/empleo): ${totalTrashed}`);
  console.log(`========================================================\n`);

  console.log('🔄 Regenerando correos.md con la bandeja de entrada limpia...');
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'in:inbox'
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      await fs.writeFile(OUTPUT_FILE, '# 📬 Bandeja de Entrada Limpia (Importantes)\n\n✅ ¡Bandeja de entrada vacía!');
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
    console.log(`✅ correos.md actualizado correctamente con ${messages.length} correos.`);
  } catch (e) {
    console.error(`Error al regenerar correos.md: ${e.message}`);
  }
}

authorize().then(cleanInbox).catch(console.error);
