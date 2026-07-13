require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const LedgerStore = require('../../runtime/stores/LedgerStore');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'config', 'didi_config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return { finanzas: { meta_diaria_bruta: 260000 } }; }
}

function parseInput(text) {
  const ingreso = parseInt((text.match(/ingreso[s]?\s*(\d+)/i) || [])[1] || '0', 10);
  const gasolina = parseInt((text.match(/gasolina\s*(\d+)/i) || [])[1] || '0', 10);
  const peajes = parseInt((text.match(/(?:peaje|peajes)\s*(\d+)/i) || [])[1] || '0', 10);
  const otros = parseInt((text.match(/otros?\s*(\d+)/i) || [])[1] || '0', 10);
  return { ingreso, gasolina, peajes, otros };
}

async function logFinances(text) {
  const data = parseInput(text);
  if (data.ingreso === 0 && data.gasolina === 0 && data.peajes === 0) {
    return "❌ No se detectaron valores válidos. Usa el formato: ingreso X gasolina Y peajes Z";
  }

  const config = loadConfig();
  const meta = config.finanzas?.meta_diaria_bruta || 260000;
  const neto = data.ingreso - data.gasolina - data.peajes - data.otros;
  const pctMeta = Math.round((data.ingreso / meta) * 100);

  const registro = {
    fecha: new Date().toISOString().split('T')[0],
    ...data,
    neto,
    meta_bruta: meta,
    porcentaje_meta: pctMeta
  };

  // Guardar en SQLite Ledger (Persistente)
  LedgerStore.emit('didi_finanzas', registro);

  // Generar reporte estructurado (Markdown)
  const report = [
    `📊 <b>LIFEOS FINANZAS DIDI</b>`,
    `📅 <b>Fecha:</b> ${registro.fecha}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💵 <b>Ingreso Bruto:</b> $${data.ingreso.toLocaleString('es-CO')} COP (${pctMeta}% de tu meta de $${meta.toLocaleString('es-CO')} COP)`,
    `⛽ <b>Gasolina:</b>      -$${data.gasolina.toLocaleString('es-CO')} COP`,
    `🛣️ <b>Peajes:</b>        -$${data.peajes.toLocaleString('es-CO')} COP`,
    `⚙️ <b>Otros:</b>         -$${data.otros.toLocaleString('es-CO')} COP`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 <b>Ganancia Neta:</b> $${neto.toLocaleString('es-CO')} COP`,
    `\n<i>${neto > 150000 ? '🔥 Excelente jornada, piloto. Sigue acumulando para tus activos.' : '⚠️ Jornada baja. El tráfico o la demanda afectó el rendimiento.'}</i>`
  ].join('\n');

  // Enviar Telegram
  try {
    const { sendTelegramMessage } = require('../../lib/integrations/telegram');
    await sendTelegramMessage(report);
  } catch (e) {
    // Si falla Telegram (ej. sin internet), no bloquea el CLI
  }

  return report;
}

if (require.main === module) {
  const args = process.argv.slice(2).join(' ');
  logFinances(args).then(console.log).catch(console.error);
}

module.exports = { logFinances, parseInput };
