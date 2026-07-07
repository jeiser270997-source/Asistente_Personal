/**
 * setup_google_calendar.js
 * Re-autoriza Google OAuth añadiendo scope de Calendar al token existente.
 * Corre UNA VEZ localmente, luego el token.json queda actualizado.
 * 
 * Uso: node scripts/setup_google_calendar.js
 */
require('dotenv').config();
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

// Scopes combinados: Gmail + Calendar + Calendar Events
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

async function main() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const key = creds.installed || creds.web;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    'http://localhost'
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // forzar para obtener nuevo refresh_token con todos los scopes
  });

  console.log('\n========================================================');
  console.log('PASO 1: Abre este enlace en tu navegador:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('PASO 2: Acepta los permisos (Gmail + Calendar)');
  console.log('PASO 3: Copia la URL completa de redireccion (empieza con http://localhost/?code=...)');
  console.log('========================================================\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const urlStr = await new Promise(resolve => rl.question('Pega la URL completa aqui: ', resolve));
  rl.close();

  const urlObj = new URL(urlStr.trim());
  const code = urlObj.searchParams.get('code');
  if (!code) throw new Error('No se encontro el codigo en la URL. Asegurate de pegar la URL completa.');

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Guardar token actualizado
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: tokens.refresh_token || JSON.parse(fs.readFileSync(TOKEN_PATH,'utf8')).refresh_token,
    scope: SCOPES.join(' '),
  });
  fs.writeFileSync(TOKEN_PATH, payload, 'utf8');

  console.log('\n✅ token.json actualizado con scopes de Gmail + Calendar');
  console.log('Scopes activos:', SCOPES.join('\n  '));

  // Test inmediato: listar proximos 3 eventos
  console.log('\nVerificando Calendar API...');
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 3,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = res.data.items || [];
    if (events.length === 0) {
      console.log('✅ Calendar conectado — sin eventos proximos');
    } else {
      console.log('✅ Calendar conectado. Proximos eventos:');
      events.forEach(e => {
        const start = e.start.dateTime || e.start.date;
        console.log('  -', start, '|', e.summary);
      });
    }
  } catch (e) {
    console.error('❌ Error Calendar:', e.message);
    console.log('Verifica que la Calendar API este habilitada en Google Console.');
  }
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
