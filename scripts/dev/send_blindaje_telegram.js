const { sendTelegramMessage } = require('../../lib/integrations/telegram');

async function main() {
  const msg = `🛡️ <b>PLAN BLINDAJE LIFEOS IMPLEMENTADO AL 100%</b>

<b>📋 Upgrades & Nuevas Skills (70 Skills Total):</b>

<b>1. ⚖️ Bufete Top & Defensa Legal (v7/v2):</b>
• <code>bufete_top</code>: Orquestador legal unificado.
• <code>tributaria-colombia-defensa</code> (v7): Prescripción ET Art 817 (5 años) + UVT 2026.
• <code>transito-colombia-defensa</code> (v2): Caducidad CNT Art 161 + nulidad fotorradares.
• <code>laboral_colombia</code>: CST, liquidaciones, despidos sin justa causa, Ley 1010.

<b>2. 🎓 Becas MinTIC & Subsidios:</b>
• <code>mintic_oportunidades</code>: TalentoTech, Vouchers SENA-MinTIC (AWS/Azure).
• <code>programas_gobierno_colombia</code>: Renta Ciudadana, IVA, Mi Casa Ya (VIS), Comfama.

<b>3. 🌍 Trabajo Remoto USD & Migración Tech:</b>
• <code>trabajo_remoto_exterior</code>: Deel, Wise, Payoneer, W-8BEN, exención IVA (Art 481 ET).
• <code>migracion_internacional</code>: Canadá Express Entry, España Nómada Digital, Alemania.
• <code>inversion_colombiano_exterior</code>: Interactive Brokers, ETFs acumulativos (VWRA/CSPX).

<b>4. 🎯 Carrera QA Senior & Aprendizaje:</b>
• <code>carrera_qa_senior</code>: Roadmap de 28 semanas a Automation Architect (Playwright, K6, Docker, CI/CD).
• <code>estudio_estrategico</code>: Técnica Feynman + Anki + Pomodoro para CESDE/SENA.

✅ <i>Plan Blindaje comiteado y verificado con 83/83 tests verdes.</i>`;

  await sendTelegramMessage(msg);
  console.log('✅ Resumen Plan Blindaje enviado exitosamente a Telegram');
}

main().catch(err => {
  console.error('❌ Error enviando Plan Blindaje a Telegram:', err.message);
  process.exit(1);
});
