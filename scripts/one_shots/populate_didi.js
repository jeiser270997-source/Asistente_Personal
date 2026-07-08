require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { createEvent } = require('./integrations/gworkspace_manager');

async function main() {
  console.log('🚗 Agendando Estrategia DiDi (Modo Piloto Automático)...');

  const shifts = [
    // LUNES Y VIERNES
    {
      summary: '🚕 DiDi: Bloque AM (Fresco y Alta Demanda)',
      start: '2026-07-06T05:00:00-05:00',
      duration: 5.5,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR',
      desc: 'Meta: ~$150k. Apagar a las 10:30 AM para evitar la ola de calor y proteger el rendimiento (8km/L).'
    },
    {
      summary: '🚕 DiDi: Bloque PM (Corto pre-clase)',
      start: '2026-07-06T15:00:00-05:00',
      duration: 2.5,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR',
      desc: 'Meta: ~$70k. Corto para llegar a clase virtual a las 6:00 PM.'
    },

    // MARTES Y JUEVES
    {
      summary: '🚕 DiDi: Bloque AM (Día Fuerte)',
      start: '2026-07-07T05:00:00-05:00',
      duration: 5.5,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH',
      desc: 'Meta: ~$150k. Turno principal.'
    },
    {
      summary: '🚕 DiDi: Bloque PM (Día Fuerte)',
      start: '2026-07-07T15:30:00-05:00',
      duration: 4.5,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH',
      desc: 'Meta: ~$125k. Bono nocturno y regreso a casa.'
    },

    // SÁBADO
    {
      summary: '🚕 DiDi: Turno Nocturno (Post-Bootcamp)',
      start: '2026-07-11T18:30:00-05:00',
      duration: 5,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=SA',
      desc: 'Meta: ~$140k. Salir directo del Bootcamp. Buen clima y alta demanda nocturna.'
    },

    // DOMINGO
    {
      summary: '🚕 DiDi: Jornada Dominical (Post-Chiquifútbol)',
      start: '2026-07-12T11:00:00-05:00',
      duration: 9,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=SU',
      desc: 'Meta: ~$260k. Aprovechando viajes de centros comerciales y salidas familiares.'
    }
  ];

  for (const s of shifts) {
    try {
      const ev = await createEvent(s.summary, s.start, s.duration, s.desc, s.rrule);
      console.log(`✅ Agendado: ${ev.summary} (${s.rrule})`);
    } catch (e) {
      console.error(`❌ Error agendando ${s.summary}:`, e.message);
    }
  }
}

main().catch(console.error);
