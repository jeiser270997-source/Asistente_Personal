const { google } = require('googleapis');
const { authorize } = require('./auth');

const QUERY = process.argv[2] || 'in:trash older_than:30d';

async function trashByQuery(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  let totalDeleted = 0;
  let pageToken;

  console.log(`🔍 Buscando correos con query: "${QUERY}"`);
  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: QUERY,
      maxResults: 100,
      pageToken,
    });
    const messages = res.data.messages || [];
    if (messages.length === 0) break;

    for (const msg of messages) {
      try {
        await gmail.users.messages.trash({ userId: 'me', id: msg.id });
        totalDeleted++;
      } catch (e) {
        console.log(`Error con ID ${msg.id}: ${e.message}`);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`✅ ${totalDeleted} correos enviados a la papelera.`);
}

authorize().then(trashByQuery).catch(console.error);
