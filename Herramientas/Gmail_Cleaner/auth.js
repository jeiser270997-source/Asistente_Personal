const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://mail.google.com/'];
const TOKEN_PATH = path.join(__dirname, '..', '..', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', '..', 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }

  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  
  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    'http://localhost'
  );

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n========================================================');
  console.log('🔗 ENLACE DE AUTENTICACIÓN GOOGLE:');
  console.log(authorizeUrl);
  console.log('========================================================\n');
  console.log('1. Abre este enlace en tu navegador.');
  console.log('2. Autoriza con tu cuenta.');
  console.log('3. Te redirigirá a una página que dice "No se puede acceder a este sitio" o similar (localhost).');
  console.log('4. Copia toda la URL de la barra de direcciones y pégala aquí abajo:\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Pega la URL completa aquí: ', async (urlStr) => {
      rl.close();
      try {
        const urlObj = new URL(urlStr);
        const code = urlObj.searchParams.get('code');
        if (!code) {
          throw new Error('No se encontró el código en la URL.');
        }
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        await saveCredentials(oauth2Client);
        console.log('¡Autenticación exitosa y guardada!');
        resolve(oauth2Client);
      } catch (err) {
        console.error('Error al procesar la URL:', err.message);
        reject(err);
      }
    });
  });
}

module.exports = { authorize };
