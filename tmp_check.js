require('dotenv').config();
const {authorize} = require('./lib/google_auth');
const {google} = require('googleapis');

(async () => {
  const auth = await authorize();
  const gmail = google.gmail({version: 'v1', auth});

  // Get latest 3 messages
  const list = await gmail.users.messages.list({userId: 'me', maxResults: 3});
  for (const msg of list.data.messages) {
    const detail = await gmail.users.messages.get({userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['From','Subject','Date']});
    const headers = detail.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || '?';
    const subject = headers.find(h => h.name === 'Subject')?.value || '?';
    const date = headers.find(h => h.name === 'Date')?.value || '?';
    console.log(`\n📧 ${date}\n   From: ${from}\n   Subj: ${subject}`);
    if (detail.data.labelIds?.includes('UNREAD')) console.log('   🔴 NO LEÍDO');
  }

  // Check inbox count
  const inbox = await gmail.users.labels.get({userId: 'me', id: 'INBOX'});
  console.log(`\n📊 INBOX: ${inbox.data.messagesTotal || 0} total, ${inbox.data.threadsUnread || 0} no leídos`);
})();
