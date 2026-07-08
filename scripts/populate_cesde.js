require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { createEvent } = require('./integrations/gworkspace_manager');

const classes = [
  { summary: 'CESDE — Clase 1 (Introductorio)', date: '2026-07-01' },
  { summary: 'CESDE — Clase 2 (Introductorio)', date: '2026-07-03' },
  { summary: 'CESDE — Clase 3 (Introductorio)', date: '2026-07-06' },
  { summary: 'CESDE — Clase 4 (Introductorio)', date: '2026-07-08' },
  { summary: 'CESDE — Clase 5 (Introductorio)', date: '2026-07-10' },
  { summary: 'CESDE — Clase 6 (Introductorio)', date: '2026-07-15' },
  { summary: 'CESDE — Clase 7 (Introductorio)', date: '2026-07-17' },
  { summary: 'CESDE — Clase 8 (Introductorio)', date: '2026-07-22' },
  { summary: 'CESDE — Clase 9 🎯 HOY ASIGNAN EL TALLER (Introductorio)', date: '2026-07-24' },
  { summary: 'CESDE — Clase 10 ⚠️ ENTREGA DEL TALLER (Introductorio)', date: '2026-07-27', description: 'Revisión del taller y envío de personas que lo realizaron.' },
];

async function main() {
  console.log('📅 Agendando clases virtuales (Lunes/Miércoles/Viernes 6-8pm)...');
  for (const c of classes) {
    const startTimeISO = `${c.date}T18:00:00-05:00`;
    try {
      await createEvent(c.summary, startTimeISO, 2, c.description || 'Curso introductorio becados CESDE · 6-8pm');
      console.log(`✅ Agendado: ${c.summary} -> ${c.date}`);
    } catch (e) {
      console.log(`❌ Error agendando ${c.summary}:`, e.message);
    }
  }

  console.log('\n📅 Agendando inicio del Bootcamp presencial (Sábados 7am-6pm)...');
  const bootcampISO = `2026-07-25T07:00:00-05:00`;
  try {
    await createEvent('🚀 CESDE Bootcamp QA — Primer día presencial', bootcampISO, 11, 'Inicio del Bootcamp QA Automation (28 semanas)\nBeca 70%\nHorario: Sábados 7am-6pm');
    console.log(`✅ Agendado: Bootcamp -> 2026-07-25`);
  } catch (e) {
    console.log(`❌ Error agendando Bootcamp:`, e.message);
  }
}

main().catch(console.error);
