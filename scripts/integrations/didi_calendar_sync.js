/**
 * scripts/integrations/didi_calendar_sync.js
 * Sincroniza el horario diario de DiDi (Smart Shifts) con Google Calendar.
 * Agrega 'popups' (alarmas) en el momento exacto del evento.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');

const CREDENTIALS = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
};

const TOKEN_FILE = path.join(__dirname, '..', '..', '.google_token.json');

function getOAuth2Client() {
  const oAuth2 = new google.auth.OAuth2(
    CREDENTIALS.client_id,
    CREDENTIALS.client_secret,
    CREDENTIALS.redirect_uri
  );
  
  if (fs.existsSync(TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    oAuth2.setCredentials(token);
  }
  return oAuth2;
}

/**
 * eventsArr format:
 * [
 *   {
 *     summary: "Despertar y Preparación",
 *     description: "Levantarse, café, revisión llantas (32 PSI).",
 *     start_iso: "2026-07-08T05:00:00-05:00",
 *     end_iso: "2026-07-08T06:00:00-05:00"
 *   }
 * ]
 */
async function syncDiDiSchedule(eventsArr) {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.log("[GCal Sync] No hay token de Google. Omitiendo alarmas.");
    return;
  }

  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });

  console.log(`[GCal Sync] Sincronizando ${eventsArr.length} alarmas/eventos en Google Calendar...`);

  let creados = 0, saltados = 0;
  for (const ev of eventsArr) {
    const summary = `🚕 ${ev.summary}`;
    const startTime = new Date(ev.start_iso).toISOString();
    const endTime = new Date(ev.end_iso).toISOString();

    // Dedup: verificar si ya existe
    try {
      const existing = await calendar.events.list({
        calendarId: 'primary',
        q: summary,
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
      });
      if ((existing.data.items || []).length > 0) {
        console.log(` ⏭️ Ya existe: ${ev.summary} a las ${new Date(ev.start_iso).toLocaleTimeString()}`);
        saltados++;
        continue;
      }
    } catch {}

    const event = {
      summary,
      description: ev.description,
      start: { dateTime: ev.start_iso, timeZone: 'America/Bogota' },
      end: { dateTime: ev.end_iso, timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 } // ¡ALARMA EN EL CELULAR!
        ],
      },
    };

    try {
      await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      console.log(` ✅ Alarma seteada: ${ev.summary} a las ${new Date(ev.start_iso).toLocaleTimeString()}`);
      creados++;
    } catch (err) {
      console.error(` ❌ Error creando alarma ${ev.summary}: ${err.message}`);
    }
  }
  console.log(`[GCal Sync] Resultado: ${creados} creados, ${saltados} saltados (ya existían)`);
}

module.exports = { syncDiDiSchedule };
