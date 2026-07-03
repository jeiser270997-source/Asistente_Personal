const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');
const { google } = require('googleapis');

const TOKEN_PATH = path.join(__dirname, '..', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

async function loadSavedCredentials() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload, 'utf8');
}

async function authorize(scopes = ['https://www.googleapis.com/auth/gmail.modify']) {
  const token = await loadSavedCredentials();
  if (token) {
    if (token.credentials?.refresh_token) {
      try {
        await token.getAccessToken();
        return token;
      } catch (e) {
        console.log('⚠️ Token expirado, re-autenticando...');
      }
    } else {
      return token;
    }
  }

  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    'http://localhost'
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  console.log('\n========================================================');
  console.log('🔗 ENLACE DE AUTENTICACIÓN GOOGLE:');
  console.log(authUrl);
  console.log('========================================================\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const urlStr = await new Promise(resolve => rl.question('Pega la URL completa aquí: ', resolve));
  rl.close();

  const urlObj = new URL(urlStr);
  const code = urlObj.searchParams.get('code');
  if (!code) throw new Error('No se encontró el código en la URL.');

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await saveCredentials(oauth2Client);
  console.log('✅ Autenticación exitosa y guardada.');

  return oauth2Client;
}

module.exports = { authorize, loadSavedCredentials };
