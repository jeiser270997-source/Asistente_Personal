const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(process.cwd(), '..', '..', 'correos.md');

const JUNK_IDS = [
  '19ed6662199a2c50',
  '19ebc94f068529a3',
  '19eb2b589954a97a',
  '19eaf9b4e0424629',
  '19ea1f4aae345c4d',
  '19e8acdf9d038408',
  '19e842a380590037',
  '19e84285bd5e8037',
  '19e7a36830d5a72d',
  '19e6b8a2b92c54a9',
  '19e66dec61685cc2',
  '19e66db36cb75a69',
  '19e66c6c9d2a5271',
  '19e66c50a5271b0d',
  '19e66c3db115f011',
  '19e66c0d06e1b1d0',
  '19e52a204294d676',
  '19e528b8b8aff3e6',
  '19e528a09d01e8c1',
  '19e60fb3ace41b10',
  '19e5143a2849e51a',
  '19e4646df857f038',
  '19e42239bea3627b',
  '19e41dfea1670fcb',
  '19e41134f540f173',
  '19e3b3f942a7a7e2'
];

// Query for ALL employment emails to delete them completely
const EMPLOYMENT_QUERY = '(subject:(empleo OR vacante OR postulación OR selección OR candidato OR cv OR resume OR interview OR entrevista) OR from:(concentrix.com OR solvoglobal.com OR computrabajo.com OR pandape.com OR serviciodeempleo.gov.co OR talent.com OR elempleo.com OR magneto365.com OR foundevercol.talkpush.com OR emtelco.com.co OR linkedin.com))';

async function cleanup(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  console.log('🗑️ 1. Borrando los IDs de basura específicos del archivo correos.md...');
  let junkDeleted = 0;
  for (const id of JUNK_IDS) {
    try {
      await gmail.users.messages.trash({ userId: 'me', id });
      junkDeleted++;
    } catch (e) {
      console.log(`[Junk ID] Error borrando ${id}: ${e.message}`);
    }
  }
  console.log(`✅ Basura específica: ${junkDeleted} correos borrados.`);

  console.log('🗑️ 2. Buscando y borrando correos de empleo en todo Gmail...');
  let employmentDeleted = 0;
  try {
    let pageToken = undefined;
    do {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: EMPLOYMENT_QUERY,
        maxResults: 100,
        pageToken
      });

      const messages = res.data.messages;
      if (messages && messages.length > 0) {
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

  console.log('🔄 3. Regenerando correos.md con lo que queda en la bandeja de entrada...');
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
