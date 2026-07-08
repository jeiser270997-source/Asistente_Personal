require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { createEvent } = require('./integrations/gworkspace_manager');

async function main() {
  console.log('📅 Agendando clases de Dominick...');

  // Chiquifútbol (Domingos 09:30-10:29, del 21 Jun al 23 Ago)
  const futbolISO = '2026-06-21T09:30:00-05:00';
  const futbolRule = 'RRULE:FREQ=WEEKLY;BYDAY=SU;UNTIL=20260824T000000Z'; // Until 23 Ago
  const futbolDesc = 'Participante: RC 1019159465 - DOMINICK ANDREÉ GUTIERREZ ROJAS\nModalidad: Presencial\nEvento: 55241587\nSede: Parque Comfama La Estrella';
  
  // Natación (Miércoles 14:00-14:59, del 17 Jun al 19 Ago)
  const natacionISO = '2026-06-17T14:00:00-05:00';
  const natacionRule = 'RRULE:FREQ=WEEKLY;BYDAY=WE;UNTIL=20260820T000000Z'; // Until 19 Ago
  const natacionDesc = 'Participante: RC 1019159465 - DOMINICK ANDREÉ GUTIERREZ ROJAS\nModalidad: Presencial\nEvento: 55234863\nAula: PISCINA 2 B\nSede: Parque Comfama La Estrella';

  try {
    const ev1 = await createEvent('⚽ Chiquifútbol 1 Encuentro | Dominick', futbolISO, 1, futbolDesc, futbolRule);
    console.log(`✅ Agendado: ${ev1.summary}`);
    
    const ev2 = await createEvent('🏊 Natación, nivel 1 | Dominick', natacionISO, 1, natacionDesc, natacionRule);
    console.log(`✅ Agendado: ${ev2.summary}`);
  } catch (e) {
    console.error('❌ Error agendando clases:', e.message);
  }
}

main().catch(console.error);
