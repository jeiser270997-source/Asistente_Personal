const { google } = require('googleapis');
const { authorize } = require('./auth');

const JUNK_IDS = [
  '19f04db2a1ef97b7',
  '19f047ab4c786469',
  '19f043cc977729af',
  '19f014245e21cc09',
  '19eff70c86314055',
  '19efb45ba124bc35',
  '19efb2ab762ac2a3',
  '19efb024bd89e184',
  '19ef8fa22e7e72e5',
  '19ef3e7d4fc396f1',
  '19ee186fa3dd9da6',
  '19ee004f0a9eaebb',
  '19ed76b56a1cd349',
  '19ed744c3423516e',
  '19ed71ee7e099dc8',
  '19ec1718b0121980',
  '19ec166a7d04b8fe'
];

async function trashEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log(`🗑️ Moviendo ${JUNK_IDS.length} correos a la papelera...`);
  
  let successCount = 0;
  for (const id of JUNK_IDS) {
    try {
      await gmail.users.messages.trash({
        userId: 'me',
        id: id
      });
      successCount++;
    } catch (e) {
      console.log(`Error borrando ${id}: ${e.message}`);
    }
  }
  
  console.log(`✅ ¡Se movieron ${successCount} correos a la basura exitosamente!`);
}

authorize().then(trashEmails).catch(console.error);
