require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../lib/llm_service');

const SEGUIMIENTO_PATH = path.join(__dirname, '..', 'data', 'sena', 'seguimiento.json');
const ALERTAS_PATH = path.join(__dirname, '..', 'data', 'contexto_maestro', 'ALERTAS_SENA.md');

function log(msg) { console.log(msg); }

function loadSeguimiento() {
  return JSON.parse(fs.readFileSync(SEGUIMIENTO_PATH, 'utf8'));
}

function saveSeguimiento(data) {
  data.actualizado = new Date().toISOString();
  fs.writeFileSync(SEGUIMIENTO_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function updateStats(data) {
  let total = 0, completadas = 0, vencidasSinCompletar = 0;
  const hoy = new Date();

  for (const [key, act] of Object.entries(data.actividades)) {
    if (act.fecha_limite) {
      const [a, m, d] = act.fecha_limite.split('-').map(Number);
      const fechaLimite = new Date(a, m - 1, d);
      act.dias_restantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));

      if (act.dias_restantes <= 3 && act.dias_restantes > 0) act.estado = 'urgente';
      else if (act.dias_restantes <= 0) act.estado = 'vencida';
      else if (act.dias_restantes <= 7) act.estado = 'activa';
      else act.estado = 'pendiente';
    }

    for (const ev of act.evidencias || []) {
      total++;
      if (ev.completado) completadas++;
      else if (act.estado === 'vencida') vencidasSinCompletar++;
    }
  }

  data.estadisticas = { total, completadas, pendientes: total - completadas, vencidas_sin_completar: vencidasSinCompletar };
}

function generateAlertasMD(data) {
  const lines = [];
  const hoy = new Date();
  lines.push(`# Alertas SENA - ${data.curso}`);
  lines.push(`> Actualizado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
  lines.push('');

  // Calculate days for act2 specially
  for (const [key, act] of Object.entries(data.actividades)) {
    const completadas = (act.evidencias || []).filter(e => e.completado).length;
    const total = (act.evidencias || []).length;
    const progressBar = '█'.repeat(completadas) + '░'.repeat(total - completadas);

    let icono;
    if (completadas === total) icono = '✅';
    else if (act.estado === 'urgente') icono = '🔴';
    else if (act.estado === 'vencida') icono = '⬛';
    else if (act.estado === 'activa') icono = '🟡';
    else icono = '🟢';

    lines.push(`### ${icono} ${act.nombre}`);
    lines.push(`\`${progressBar}\` ${completadas}/${total} | ${act.fecha_limite} | ${act.estado.toUpperCase()}`);
    lines.push('');

    for (const ev of (act.evidencias || [])) {
      const check = ev.completado ? 'x' : ' ';
      lines.push(`- [${check}] **${ev.tipo.toUpperCase()}**: ${ev.nombre}`);
    }
    lines.push('');
  }

  // Stats
  const s = data.estadisticas;
  lines.push('---');
  lines.push(`**Progreso**: ${s.completadas}/${s.total} completadas | ${s.pendientes} pendientes`);
  if (s.vencidas_sin_completar > 0) lines.push(`⚠ **${s.vencidas_sin_completar} evidencias vencidas sin entregar**`);

  fs.writeFileSync(ALERTAS_PATH, lines.join('\n'), 'utf8');
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

if (cmd === 'completar') {
  const id = args[0];
  if (!id) { log('Uso: node scripts/moodle_sena_tracker.js completar <id>'); process.exit(1); }

  const data = loadSeguimiento();
  let found = false;

  for (const [key, act] of Object.entries(data.actividades)) {
    for (const ev of (act.evidencias || [])) {
      if (ev.id === id) {
        ev.completado = !ev.completado;
        log(`${ev.completado ? '✅ Completado' : '⬜ Desmarcado'}: ${ev.nombre}`);
        found = true;
      }
    }
  }

  if (!found) { log(`❌ ID no encontrado: ${id}`); process.exit(1); }

  updateStats(data);
  saveSeguimiento(data);
  generateAlertasMD(data);
  log(`\nProgreso: ${data.estadisticas.completadas}/${data.estadisticas.total}`);
} else if (cmd === 'ver' || !cmd) {
  const data = loadSeguimiento();
  updateStats(data);
  saveSeguimiento(data);
  generateAlertasMD(data);

  log(`\n📚 ${data.curso}`);
  log(`═══════════════════════════════════\n`);

  for (const [key, act] of Object.entries(data.actividades)) {
    const completadas = (act.evidencias || []).filter(e => e.completado).length;
    const total = (act.evidencias || []).length;
    const icono = act.estado === 'urgente' ? '🔴' : act.estado === 'vencida' ? '⬛' : completadas === total ? '✅' : '🟡';

    log(`${icono} ${act.nombre}`);
    log(`   ${completadas}/${total} | Vence: ${act.fecha_limite} | ${act.dias_restantes} dias restantes`);

    for (const ev of (act.evidencias || [])) {
      log(`   [${ev.completado ? '✓' : ' '}] ${ev.id} - ${ev.nombre}`);
    }
    log('');
  }

  log(`📊 Progreso: ${data.estadisticas.completadas}/${data.estadisticas.total}`);
} else if (cmd === 'resumen') {
  const data = loadSeguimiento();
  updateStats(data);

  const hoy = new Date();
  let resumen = `📚 SENA: ${data.curso}\n\n`;

  for (const [key, act] of Object.entries(data.actividades)) {
    const completadas = (act.evidencias || []).filter(e => e.completado).length;
    const total = (act.evidencias || []).length;
    if (completadas === total) continue;

    let icono = act.estado === 'urgente' ? '🔴' : '🟡';
    resumen += `${icono} ${act.nombre.split(' - ')[0]}: ${completadas}/${total} (vence ${act.fecha_limite})\n`;
  }

  resumen += `\n📊 ${data.estadisticas.completadas}/${data.estadisticas.total} completadas`;
  log(resumen);
} else {
  log('Uso:');
  log('  node scripts/moodle_sena_tracker.js ver          - Ver todas las actividades');
  log('  node scripts/moodle_sena_tracker.js completar ID  - Marcar/desmarcar evidencia');
  log('  node scripts/moodle_sena_tracker.js resumen       - Resumen para Telegram');
}
