require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const { createEvent } = require('../scripts/integrations/gworkspace_manager');

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

  console.log('🔍 Limpiando eventos previos de DiDi y Natación...');
  const queries = ['DiDi', 'Natación'];
  for (const q of queries) {
    const res = await calendar.events.list({
      calendarId: 'primary',
      q: q,
      timeMin: '2026-07-01T00:00:00Z',
      maxResults: 50
    });
    const events = res.data.items;
    if (events && events.length > 0) {
      for (const event of events) {
        await calendar.events.delete({ calendarId: 'primary', eventId: event.id });
        console.log(`🗑️  Borrado: ${event.summary}`);
      }
    }
  }

  console.log('\n📅 Agendando la nueva estrategia sincronizada...');

  const shifts = [
    // LUNES Y VIERNES
    {
      summary: '🚕 DiDi: Bloque AM (Fresco y Alta Demanda)',
      start: '2026-07-06T05:00:00-05:00',
      duration: 6.5, // Hasta las 11:30 AM
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR',
      desc: 'Meta: ~$175k. Apagar a las 11:30 AM e ir directo a buscar a Dominick.',
      reminder: 60
    },
    {
      summary: '🚕 DiDi: Bloque PM (Corto pre-clase)',
      start: '2026-07-06T15:30:00-05:00',
      duration: 2, // 15:30 a 17:30
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR',
      desc: 'Meta: ~$60k. Corto para llegar a clase virtual a las 6:00 PM.',
      reminder: 60
    },

    // MARTES Y JUEVES
    {
      summary: '🚗 Llevar a Dominick a la escuela',
      start: '2026-07-07T08:00:00-05:00',
      duration: 0.5, // 8:00 a 8:30 AM
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH',
      desc: 'Llevar a Dominick porque Angelina está en curso de inglés (7:00 AM - 8:45 AM).',
      reminder: 60
    },
    {
      summary: '🚕 DiDi: Bloque AM (Día Fuerte Corto)',
      start: '2026-07-07T08:30:00-05:00',
      duration: 3, // 8:30 a 11:30 AM
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH',
      desc: 'Meta: ~$80k. Turno corto de mañana tras dejar a Dominick.',
      reminder: 60
    },
    {
      summary: '🚕 DiDi: Bloque PM (Extendido para compensar)',
      start: '2026-07-07T15:30:00-05:00',
      duration: 6.5, // 15:30 a 22:00
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH',
      desc: 'Meta: ~$180k. Turno extendido hasta las 10:00 PM. A esa hora poner ruta hacia casa.',
      reminder: 60
    },

    // RECOGER A DOMINICK (LUNES A VIERNES)
    {
      summary: '🚗 Recoger a Dominick de la escuela',
      start: '2026-07-06T11:30:00-05:00',
      duration: 0.5, // 11:30 a 12:00
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      desc: 'Dominick sale a las 11:45 AM. Enrutar DiDi hacia la escuela con 1 hora de anticipación para evitar viajes lejos.',
      reminder: 60 // Alarma a las 10:30 AM (1 hora antes)
    },

    // NATACIÓN CON RECORDATORIO DE 2 HORAS
    {
      summary: '🏊 Natación, nivel 1 | Dominick',
      start: '2026-07-08T14:00:00-05:00', // Miércoles
      duration: 1, // 14:00 a 15:00
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=WE;UNTIL=20260820T000000Z',
      desc: 'Participante: Dominick\nSede: Parque Comfama La Estrella\nAlarma configurada para pitar 2 horas antes (12:00 PM).',
      reminder: 120 // 2 HORAS ANTES
    },
    
    // SÁBADO
    {
      summary: '🚕 DiDi: Turno Nocturno (Post-Bootcamp)',
      start: '2026-07-11T18:30:00-05:00',
      duration: 5,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=SA',
      desc: 'Meta: ~$140k. Salir directo del Bootcamp. Buen clima y alta demanda nocturna.',
      reminder: 60
    },

    // DOMINGO
    {
      summary: '🚕 DiDi: Jornada Dominical',
      start: '2026-07-12T11:00:00-05:00',
      duration: 9,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=SU',
      desc: 'Meta: ~$260k. Aprovechando viajes familiares.',
      reminder: 60
    }
  ];

  for (const s of shifts) {
    try {
      const ev = await createEvent(s.summary, s.start, s.duration, s.desc, s.rrule, s.reminder);
      console.log(`✅ Agendado: ${ev.summary} (${s.rrule})`);
    } catch (e) {
      console.error(`❌ Error agendando ${s.summary}:`, e.message);
    }
  }
}

fixEvents().catch(console.error);
