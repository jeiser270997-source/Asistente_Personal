const { google } = require('googleapis');
const { authorize } = require('./auth');

async function readEmail(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  try {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: '19f013a721a7ac8f',
      format: 'full'
    });
    
    function extractBody(payload) {
      let body = '';
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body.data) {
              body += Buffer.from(part.body.data, 'base64').toString('utf8');
            }
          } else if (part.parts) {
            body += extractBody(part);
          }
        }
      } else if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf8');
      }
      return body;
    }
    
    console.log("=== SNIPPET ===");
    console.log(msg.data.snippet);
    console.log("=== BODY ===\n" + extractBody(msg.data.payload));
  } catch(e) {
    console.error(e);
  }
}

authorize().then(readEmail).catch(console.error);
