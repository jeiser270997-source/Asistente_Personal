require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { createEvent } = require('./integrations/gworkspace_manager');

async function main() {
  console.log('🥎 Agendando partidos y recordatorios de Softball...');

  const events = [
    // Juego 1: Gigantes (Jueves 9 Julio)
    {
      summary: '🎒 Acomodar tula para juego vs Gigantes',
      start: '2026-07-08T20:30:00-05:00', // Miércoles a las 8:30 PM (después de clase)
      duration: 0.5,
      desc: 'Preparar equipo para el partido de mañana.',
      reminder: 15
    },
    {
      summary: '🥎 Juego: Gigantes (Medellín)',
      start: '2026-07-09T20:45:00-05:00', // Jueves 8:45 PM
      duration: 2,
      desc: 'Enrutar DiDi hacia el estadio 1 hora antes (Alarma 7:45 PM).',
      reminder: 60
    },

    // Juego 2: Bufalos (Viernes 10 Julio)
    {
      summary: '🎒 Acomodar tula para juego vs Bufalos',
      start: '2026-07-09T23:00:00-05:00', // Jueves a las 11:00 PM (llegando del otro juego)
      duration: 0.5,
      desc: 'Preparar equipo para el partido en Envigado.',
      reminder: 15
    },
    {
      summary: '🥎 Juego: vs Bufalos (Envigado) ¡JUEGAS TÚ!',
      start: '2026-07-10T19:45:00-05:00', // Viernes 7:45 PM
      duration: 2,
      desc: '⚠️ Tienes choque de horario con la clase de CESDE (6:00 a 8:00 PM). Enrutar DiDi hacia Envigado con la clase en audio.',
      reminder: 60 // Alarma 6:45 PM
    },

    // Juego 3: La Ceja vs Envigado B (Domingo 12 Julio)
    {
      summary: '📞 Llamar a Tossi - Pelotas para juego La Ceja',
      start: '2026-07-11T13:00:00-05:00', // Sábado 1:00 PM (hora de almuerzo en Bootcamp)
      duration: 0.5,
      desc: 'Llamar a Tossi a ver si va a bajar a jugar el domingo, para dejarle las pelotas.',
      reminder: 30
    },
    {
      summary: '⚾ Juego: La Ceja vs Envigado B (Opcional)',
      start: '2026-07-12T16:00:00-05:00', // Domingo 4:00 PM
      duration: 2,
      desc: 'Solo ir si te toca ir de manager, sino las pelotas las lleva Tossi.',
      reminder: 60
    }
  ];

  for (const s of events) {
    try {
      // Usamos rrule null porque son eventos únicos
      const ev = await createEvent(s.summary, s.start, s.duration, s.desc, null, s.reminder);
      console.log(`✅ Agendado: ${ev.summary}`);
    } catch (e) {
      console.error(`❌ Error agendando ${s.summary}:`, e.message);
    }
  }
}

main().catch(console.error);
