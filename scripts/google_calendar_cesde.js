/**
 * google_calendar_cesde.js
 * Paso 1: Genera URL de autorización
 * Paso 2: Intercambia código por token
 * Paso 3: Crea eventos CESDE en Google Calendar con alarma 1h antes
 *
 * Uso:
 *   node scripts/google_calendar_cesde.js auth     ← genera URL
 *   node scripts/google_calendar_cesde.js create   ← crea eventos (requiere token)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google }  = require('googleapis');
const fs          = require('node:fs');
const path        = require('node:path');
const readline    = require('node:readline');

const CREDENTIALS = {
  client_id:     process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri:  'urn:ietf:wg:oauth:2.0:oob',
};

const TOKEN_FILE = path.join(__dirname, '..', '.google_token.json');
const SCOPES     = ['https://www.googleapis.com/auth/calendar.events'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    CREDENTIALS.client_id,
    CREDENTIALS.client_secret,
    CREDENTIALS.redirect_uri
  );
}

// ── Paso 1: Generar URL de autorización ──────────────────────────
function generateAuthUrl() {
  const oAuth2 = getOAuth2Client();
  const url = oAuth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
  console.log('\n════════════════════════════════════════════════');
  console.log('  AUTORIZAR GOOGLE CALENDAR');
  console.log('════════════════════════════════════════════════');
  console.log('\n1. Abre este enlace en tu navegador:\n');
  console.log(url);
  console.log('\n2. Autoriza el acceso a Google Calendar');
  console.log('3. Copia el código que aparece');
  console.log('4. Ejecuta:\n   node scripts/google_calendar_cesde.js token <CÓDIGO>\n');
}

// ── Paso 2: Intercambiar código por token ─────────────────────────
async function saveToken(code) {
  const oAuth2 = getOAuth2Client();
  const { tokens } = await oAuth2.getToken(code);
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log('✅ Token guardado en .google_token.json');
  console.log('   Ahora ejecuta: node scripts/google_calendar_cesde.js create');
}

// ── Paso 3: Crear eventos CESDE ───────────────────────────────────
async function createEvents() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.log('❌ No hay token. Primero ejecuta: node scripts/google_calendar_cesde.js auth');
    return;
  }

  const oAuth2 = getOAuth2Client();
  const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  oAuth2.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oAuth2 });

  // COT = UTC-5 → 18:00 COT = 23:00 UTC
  const clases = [
    { fecha: '2026-07-08', num: 4,  extra: '' },
    { fecha: '2026-07-10', num: 5,  extra: '' },
    { fecha: '2026-07-15', num: 6,  extra: '' },
    { fecha: '2026-07-17', num: 7,  extra: '' },
    { fecha: '2026-07-22', num: 8,  extra: '' },
    { fecha: '2026-07-24', num: 9,  extra: '🎯 HOY ASIGNAN EL TALLER' },
    { fecha: '2026-07-27', num: 10, extra: '⚠️ ENTREGA DEL TALLER' },
    { fecha: '2026-07-25', num: null, extra: '🚀 Primer día Bootcamp QA', start: '07:00', end: '18:00' },
  ];

  console.log('\n📅 Creando eventos en Google Calendar...\n');

  for (const c of clases) {
    const isBootcamp = c.num === null;
    const startTime  = c.start || '18:00';
    const endTime    = c.end   || '20:00';
    const summary    = isBootcamp
      ? '🚀 CESDE Bootcamp QA — Primer día presencial'
      : `CESDE — Clase ${c.num}${c.extra ? ' ' + c.extra : ''} (Introductorio)`;
    const description = isBootcamp
      ? 'Inicio del Bootcamp QA Automation (28 semanas)\nBeca 70%\nHorario: Sábados 7am-6pm'
      : `Curso introductorio becados CESDE · 6-8pm${c.extra ? '\n' + c.extra : ''}`;

    const event = {
      summary,
      description,
      location: 'CESDE, Medellín, Colombia',
      start: { dateTime: `${c.fecha}T${startTime}:00`, timeZone: 'America/Bogota' },
      end:   { dateTime: `${c.fecha}T${endTime}:00`,   timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },   // alarma teléfono 1h antes
          ...(c.num === 10 ? [{ method: 'popup', minutes: 1440 }] : []),  // +24h para entrega
          ...(c.num === 9  ? [{ method: 'popup', minutes: 0   }] : []),   // al inicio clase 9
        ],
      },
    };

    try {
      const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
      console.log(`  ✅ Clase ${c.num || 'Bootcamp'} — ${c.fecha} → ${res.data.htmlLink}`);
    } catch (e) {
      console.log(`  ❌ Error Clase ${c.num}: ${e.message}`);
    }
  }

  console.log('\n✅ Todos los eventos creados. Revisa Google Calendar.');
}

// ── Main ──────────────────────────────────────────────────────────
const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === 'auth')                    generateAuthUrl();
else if (cmd === 'token' && arg)       saveToken(arg).catch(console.error);
else if (cmd === 'create')             createEvents().catch(console.error);
else {
  console.log('Uso:');
  console.log('  node scripts/google_calendar_cesde.js auth');
  console.log('  node scripts/google_calendar_cesde.js token <CÓDIGO>');
  console.log('  node scripts/google_calendar_cesde.js create');
}
