const { google } = require('googleapis');
const fs = require('fs');

const key = JSON.parse(fs.readFileSync('../../credentials.json')).installed;
const oauth2Client = new google.auth.OAuth2(
  key.client_id,
  key.client_secret,
  'http://localhost:62000'
);

async function exchange() {
  try {
    const { tokens } = await oauth2Client.getToken('4/0AdkVLPxN8T14ItctQUFPtzCo_iZ8rta70mrhCAqz1I_KLAOAGT4H6fcYtBEheZ3xwNDYlw');
    fs.writeFileSync('../../token.json', JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token
    }));
    console.log('EXITO');
  } catch(e) {
    console.error(e);
  }
}
exchange();
