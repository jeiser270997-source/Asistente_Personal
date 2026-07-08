require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const { createEvent } = require('./integrations/gworkspace_manager');

const TOKEN_FILE = path.join(__dirname, '..', '.google_token.json');
const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials.json');

function getAuthClient() {
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

async function fixEvents() {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  console.log('🔍 Buscando evento incorrecto de Bootcamp...');
  const res = await calendar.events.list({
    calendarId: 'primary',
    q: 'CESDE Bootcamp QA',
    timeMin: '2026-07-01T00:00:00Z',
    maxResults: 10
  });

  const events = res.data.items;
  if (events && events.length > 0) {
    for (const event of events) {
      if (event.summary.includes('CESDE Bootcamp QA')) {
        await calendar.events.delete({ calendarId: 'primary', eventId: event.id });
        console.log(`🗑️  Evento borrado: ${event.summary}`);
      }
    }
  } else {
    console.log('No se encontró el evento Bootcamp. (Tal vez ya se borró).');
  }

  console.log('📅 Creando evento recurrente Técnico en Desarrollo de Software (Sábados 7am-6pm)...');
  const tecnicoISO = `2026-07-25T07:00:00-05:00`;
  const description = 'Primer semestre del Técnico en Desarrollo de Software\nCESDE\nHorario: Sábados 7:00 AM - 6:00 PM';
  // Recurrencia: Semanal los sábados por 24 semanas (aprox 6 meses)
  const rrule = 'RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=24';

  try {
    const newEvent = await createEvent('Técnico en Desarrollo de Software (CESDE)', tecnicoISO, 11, description, rrule);
    console.log(`✅ Agendado correctamente: ${newEvent.summary}`);
  } catch (e) {
    console.log(`❌ Error agendando el Técnico:`, e.message);
  }
}

fixEvents().catch(console.error);
