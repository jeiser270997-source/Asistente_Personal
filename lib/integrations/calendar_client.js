/**
 * calendar_client.js
 * Cliente Google Calendar para LifeOS.
 * Lee eventos, crea recordatorios, sincroniza con tareas pendientes.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const { authorize } = require('./google_auth');

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Obtener los próximos N eventos del calendario primario
 */
async function getProximosEventos(maxResults = 10, dias = 7) {
  try {
    const auth = await authorize(CALENDAR_SCOPES);
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const until = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: until.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    return events.map(e => ({
      id: e.id,
      titulo: e.summary || '(sin título)',
      inicio: e.start.dateTime || e.start.date,
      fin: e.end?.dateTime || e.end?.date,
      descripcion: e.description || '',
      lugar: e.location || '',
      link: e.htmlLink,
    }));
  } catch (e) {
    if (e.message?.includes('invalid_grant') || e.message?.includes('Token')) {
      return { error: 'Token expirado. Corre: node scripts/setup_google_calendar.js' };
    }
    if (e.message?.includes('Calendar API has not been used')) {
      return { error: 'Habilita Calendar API en console.cloud.google.com/apis/library' };
    }
    return { error: e.message };
  }
}

/**
 * Crear un evento en el calendario
 */
async function crearEvento({ titulo, inicio, fin, descripcion = '', lugar = '' }) {
  try {
    const auth = await authorize(CALENDAR_SCOPES);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: titulo,
      description: descripcion,
      location: lugar,
      start: { dateTime: new Date(inicio).toISOString(), timeZone: 'America/Bogota' },
      end: { dateTime: new Date(fin || inicio).toISOString(), timeZone: 'America/Bogota' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
    console.log(`[Calendar] ✅ Evento creado: ${titulo} (${res.data.id})`);
    return { ok: true, id: res.data.id, link: res.data.htmlLink };
  } catch (e) {
    console.error('[Calendar] Error creando evento:', e.message);
    return { ok: false, error: e.message };
  }
}

/**
 * Resumen del calendario para el briefing diario
 */
async function getBriefingCalendar() {
  const eventos = await getProximosEventos(5, 3); // próximos 3 días
  if (eventos.error) return `❌ Calendar no disponible: ${eventos.error}`;
  if (eventos.length === 0) return '📅 Sin eventos próximos (3 días)';

  const lines = eventos.map(e => {
    const fecha = new Date(e.inicio).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    return `• ${fecha} — ${e.titulo}`;
  });

  return `📅 Próximos eventos:\n${lines.join('\n')}`;
}

module.exports = { getProximosEventos, crearEvento, getBriefingCalendar };
