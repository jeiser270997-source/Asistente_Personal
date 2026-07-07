const { sendTelegramMessage } = require('../lib/telegram');

function getColombiaHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false }), 10);
}

function getColombiaTime() {
  return new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true });
}

async function main() {
  const hour = getColombiaHour();

  if (hour === 6) {
    await sendTelegramMessage(
      `⚡ <b>DeepSeek API — Hoy</b>\n\n` +
      `🟢 <b>Barato (valle):</b> 5:00 AM – 8:00 PM + 11:00 PM – 1:00 AM\n` +
      `🔴 <b>Caro (pico):</b> 8:00 – 11:00 PM y 1:00 – 5:00 AM\n\n` +
      `💡 Usa la API de día o después de las 11 PM para pagar la tarifa regular.`
    );
  }

  if (hour === 19) {
    await sendTelegramMessage(
      `⚠️ <b>DeepSeek API</b>\n\n` +
      `🔴 En 1 hora (8 PM) empieza horario <b>pico</b> — precio x2.\n` +
      `🟢 Vuelve a valle a las 11 PM.\n\n` +
      `💡 Si vas a usar la API, hazlo ahora antes del aumento.`
    );
  }

  if (hour === 22) {
    await sendTelegramMessage(
      `✅ <b>DeepSeek API</b>\n\n` +
      `🟢 En 1 hora (11 PM) vuelve tarifa <b>valle</b>.\n` +
      `🔴 Siguiente pico: 1:00 – 5:00 AM.\n\n` +
      `💡 Ya casi puedes usar la API al precio regular.`
    );
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
