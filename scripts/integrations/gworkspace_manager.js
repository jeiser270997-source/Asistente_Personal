/**
 * scripts/integrations/gworkspace_manager.js
 * 
 * Wrapper nativo para Google Workspace (Calendar) diseñado para usarse como CLI.
 * Permite a otros scripts de LifeOS inyectar eventos instantáneamente.
 * (Inspirado en la eficiencia de googleworkspace/cli en Rust)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');
const CREDENTIALS_FILE = path.join(__dirname, '..', '..', 'credentials.json');

function getAuthClient() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('Falta el token de Google (.google_token.json). Corre setup_google_calendar.js primero.');
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const key = creds.installed || creds.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris ? key.redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob'
  );
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Crea un evento en el calendario principal.
 */
async function createEvent(summary, startTimeISO, durationHours = 1, description = '', recurrenceRule = null, reminderMinutes = 60) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(startTimeISO);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  const event = {
    summary: summary,
    description: description,
    start: { dateTime: start.toISOString(), timeZone: 'America/Bogota' },
    end: { dateTime: end.toISOString(), timeZone: 'America/Bogota' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes }
      ],
    },
  };

  if (recurrenceRule) {
    event.recurrence = [recurrenceRule];
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return res.data;
}

// ─── Interfaz CLI ─────────────────────────────────────────────
if (require.main === module) {
  const [,, cmd, summary, startTime, duration] = process.argv;

  if (cmd === 'create') {
    if (!summary || !startTime) {
      console.log('Uso: node gworkspace_manager.js create "Titulo" "2026-07-08T18:00:00Z" [duration_hours]');
      process.exit(1);
    }
    createEvent(summary, startTime, parseFloat(duration || '1'))
      .then(data => console.log(`✅ Evento creado: ${data.htmlLink}`))
      .catch(e => console.error('❌ Error creando evento:', e.message));
  } else {
    console.log('Comandos soportados: create');
  }
}

module.exports = {
  createEvent
};
