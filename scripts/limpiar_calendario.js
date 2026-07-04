const { google } = require('googleapis');
const { authorize } = require('../lib/google_auth');

async function main() {
  const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar';
  const auth = await authorize([CAL_SCOPE], true);
  const cal = google.calendar({ version: 'v3', auth });

  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: new Date(0).toISOString(),
    timeMax: new Date('2027-01-01').toISOString(),
    maxResults: 2500,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('✅ No hay eventos en el calendario.');
    return;
  }

  console.log(`📋 Encontrados ${events.length} eventos. Eliminando...`);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    await cal.events.delete({ calendarId: 'primary', eventId: e.id });
    if ((i + 1) % 50 === 0) console.log(`  → ${i + 1}/${events.length} eliminados`);
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`✅ ${events.length} eventos eliminados del calendario principal.`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
