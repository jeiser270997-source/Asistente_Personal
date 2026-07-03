const { google } = require('googleapis');
const fs = require('fs');

const key = JSON.parse(fs.readFileSync('../../credentials.json')).installed;
const oauth2Client = new google.auth.OAuth2(
  key.client_id,
  key.client_secret,
  'http://localhost:62000'
);

const authCode = process.env.GOOGLE_AUTH_CODE;
if (!authCode) {
  console.error('❌ Define GOOGLE_AUTH_CODE en tu .env o ejecútalo con:');
  console.error('   $env:GOOGLE_AUTH_CODE="4/0..."; node exchange.js');
  process.exit(1);
}

async function exchange() {
  try {
    const { tokens } = await oauth2Client.getToken(authCode);
    fs.writeFileSync('../../token.json', JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token
    }));
    console.log('✅ Token guardado exitosamente');
  } catch (e) {
    console.error('❌ Error intercambiando código:', e.message);
  }
}
exchange();
