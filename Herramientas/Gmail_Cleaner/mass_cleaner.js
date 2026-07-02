const { google } = require('googleapis');
const { authorize } = require('./auth');

const JUNK_DOMAINS_AND_EMAILS = [
  'careers.concentrix.com',
  'pandape.com',
  'emtelco.com.co',
  'linkedin.com', // Esto abarcará updates, messages, notifications, jobalerts
  'foundevercol.talkpush.com',
  'solvoglobal.com',
  'sise@serviciodeempleo.gov.co',
  'computrabajo.com'
];

async function massClean(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('🧹 Iniciando limpieza masiva de basura...');

  let totalDeleted = 0;
  
  for (const query of JUNK_DOMAINS_AND_EMAILS) {
    try {
      console.log(`Buscando correos de: ${query}`);
      let pageToken = undefined;
      
      do {
        const res = await gmail.users.messages.list({
          userId: 'me',
          q: `from:${query}`,
          maxResults: 100,
          pageToken: pageToken
        });
        
        const messages = res.data.messages;
        if (messages && messages.length > 0) {
          console.log(`  Encontrados ${messages.length} correos. Borrando...`);
          for (const msg of messages) {
            await gmail.users.messages.trash({
              userId: 'me',
              id: msg.id
            });
            totalDeleted++;
          }
        }
        
        pageToken = res.data.nextPageToken;
      } while (pageToken);
      
    } catch (e) {
      console.log(`Error buscando ${query}: ${e.message}`);
    }
  }

  console.log(`\n✅ ¡Limpieza completada! Se borraron ${totalDeleted} correos basura en total.`);
}

authorize().then(massClean).catch(console.error);
