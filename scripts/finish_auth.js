require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '.google_token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

async function main() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const key = creds.installed || creds.web;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    'http://localhost'
  );

  const urlStr = process.argv[2];
  const urlObj = new URL(urlStr.trim());
  const code = urlObj.searchParams.get('code');
  if (!code) throw new Error('No code found in URL');

  const { tokens } = await oauth2Client.getToken(code);
  
  let currentToken = {};
  if (fs.existsSync(TOKEN_PATH)) {
      currentToken = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  }

  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: tokens.refresh_token || currentToken.refresh_token,
    scope: SCOPES.join(' '),
  });
  
  fs.writeFileSync(TOKEN_PATH, payload, 'utf8');
  console.log('✅ TOKEN GUARDADO EXITOSAMENTE!');
}

main().catch(console.error);
