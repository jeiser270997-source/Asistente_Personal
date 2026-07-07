require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { main: download } = require('./download_attachments');
const { main: analyze } = require('./analyze_documents');
const { sendTelegramMessage } = require('../../lib/integrations/telegram');

async function main() {
  console.log('╔══════════════════════════════════╗');
  console.log('║   Document Pipeline v1.0        ║');
  console.log('╚══════════════════════════════════╝\n');

  // Paso 1: Descargar adjuntos
  console.log('📥 PASO 1: Descargando adjuntos...');
  const dlResult = await download();

  // Paso 2: Analizar documentos
  console.log('\n🧠 PASO 2: Analizando documentos...');
  const ar = await analyze();

  // Paso 3: Notificar
  const lines = [];
  if (dlResult.nuevos > 0) {
    lines.push(`📥 <b>${dlResult.nuevos}</b> emails con adjuntos descargados`);
  }
  if (ar.analyzed > 0) {
    lines.push(`🧠 <b>${ar.analyzed}</b> documentos analizados con IA`);
  }
  if (lines.length > 0) {
    const msg = `📋 <b>Document Pipeline</b>\n\n${lines.join('\n')}\n\nTotal en archivo: ${ar.total || 0} docs`;
    await sendTelegramMessage(msg);
    console.log('📨 Telegram notificado.');
  } else {
    console.log('✅ Sin novedades.');
  }

  console.log('\n🏁 Pipeline completado.');
}

main().catch(e => {
  console.error('💥', e.message);
  process.exit(1);
});
