require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let SeguimientoStore = null;
let RE = null;
if (USE_SQLITE) {
  SeguimientoStore = require('../../runtime/stores/SeguimientoStore');
  RE = require('../../lib/runtime/resume_engine');
}

const ALERTAS_PATH = path.join(__dirname, '..', 'data', 'contexto_maestro', 'ALERTAS_SENA.md');

function log(msg) { console.log(msg); }

function loadSeguimientoJson() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sena', 'seguimiento.json'), 'utf8')); } catch { return null; }
}

function saveSeguimientoJson(data) {
  data.actualizado = new Date().toISOString();
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'sena', 'seguimiento.json'), JSON.stringify(data, null, 2), 'utf8');
}

function loadSeguimiento() {
  if (USE_SQLITE) return SeguimientoStore.get();
  return loadSeguimientoJson() || { curso: null, ficha: null, actividades: {}, progreso: {} };
}

function saveSeguimiento(data) {
  data.actualizado = new Date().toISOString();
  if (USE_SQLITE) {
    SeguimientoStore.update(data);
  } else {
    saveSeguimientoJson(data);
  }
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
  lines.push(`# Alertas SENA - ${data.curso}`);
  lines.push(`> Actualizado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
  lines.push('');

  for (const [key, act] of Object.entries(data.actividades)) {
    const completadas = (act.evidencias || []).filter(e => e.completado).length;
    const total = (act.evidencias || []).length;
    const progressBar = 'â–ˆ'.repeat(completadas) + 'â–‘'.repeat(total - completadas);

    let icono;
    if (completadas === total) icono = 'âœ…';
    else if (act.estado === 'urgente') icono = 'ðŸ”´';
    else if (act.estado === 'vencida') icono = 'â¬›';
    else if (act.estado === 'activa') icono = 'ðŸŸ¡';
    else icono = 'ðŸŸ¢';

    lines.push(`### ${icono} ${act.nombre}`);
    lines.push(`\`${progressBar}\` ${completadas}/${total} | ${act.fecha_limite} | ${act.estado.toUpperCase()}`);
    lines.push('');

    for (const ev of (act.evidencias || [])) {
      const check = ev.completado ? 'x' : ' ';
      lines.push(`- [${check}] **${ev.tipo.toUpperCase()}**: ${ev.nombre}`);
    }
    lines.push('');
  }

  const s = data.estadisticas;
  lines.push('---');
  lines.push(`**Progreso**: ${s.completadas}/${s.total} completadas | ${s.pendientes} pendientes`);
  if (s.vencidas_sin_completar > 0) lines.push(`âš  **${s.vencidas_sin_completar} evidencias vencidas sin entregar**`);

  fs.writeFileSync(ALERTAS_PATH, lines.join('\n'), 'utf8');
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

function run() {
  if (cmd === 'completar') {
    const id = args[0];
    if (!id) { log('Uso: node scripts/moodle_sena_tracker.js completar <id>'); process.exit(1); }

    if (USE_SQLITE) RE.start('sena_tracker', { cmd, id });
    const data = loadSeguimiento();
    let found = false;

    for (const [key, act] of Object.entries(data.actividades)) {
      for (const ev of (act.evidencias || [])) {
        if (ev.id === id) {
          ev.completado = !ev.completado;
          log(`${ev.completado ? 'Completado' : 'Desmarcado'}: ${ev.nombre}`);
          found = true;
        }
      }
    }

    if (!found) { log('ID no encontrado: ' + id); if (USE_SQLITE) RE.finish('sena_tracker', 'error', { reason: 'id_not_found' }); process.exit(1); }

    updateStats(data);
    saveSeguimiento(data);
    generateAlertasMD(data);
    log(`Progreso: ${data.estadisticas.completadas}/${data.estadisticas.total}`);
    if (USE_SQLITE) RE.finish('sena_tracker', 'success', { cmd, id });

  } else if (cmd === 'ver' || !cmd) {
    if (USE_SQLITE) RE.start('sena_tracker', { cmd: 'ver' });
    const data = loadSeguimiento();
    updateStats(data);
    saveSeguimiento(data);
    generateAlertasMD(data);

    log(`\n${data.curso}`);
    log('');

    for (const [key, act] of Object.entries(data.actividades)) {
      const completadas = (act.evidencias || []).filter(e => e.completado).length;
      const total = (act.evidencias || []).length;
      const icono = act.estado === 'urgente' ? 'ðŸ”´' : act.estado === 'vencida' ? 'â¬›' : completadas === total ? 'âœ…' : 'ðŸŸ¡';

      log(`${icono} ${act.nombre}`);
      log(`   ${completadas}/${total} | Vence: ${act.fecha_limite} | ${act.dias_restantes} dias restantes`);

      for (const ev of (act.evidencias || [])) {
        log(`   [${ev.completado ? 'v' : ' '}] ${ev.id} - ${ev.nombre}`);
      }
      log('');
    }

    log(`Progreso: ${data.estadisticas.completadas}/${data.estadisticas.total}`);
    if (USE_SQLITE) RE.finish('sena_tracker', 'success', { cmd: 'ver' });

  } else if (cmd === 'resumen') {
    const data = loadSeguimiento();
    updateStats(data);

    let resumen = `SENA: ${data.curso}\n\n`;

    for (const [key, act] of Object.entries(data.actividades)) {
      const completadas = (act.evidencias || []).filter(e => e.completado).length;
      const total = (act.evidencias || []).length;
      if (completadas === total) continue;

      const icono = act.estado === 'urgente' ? 'ðŸ”´' : 'ðŸŸ¡';
      resumen += `${icono} ${act.nombre.split(' - ')[0]}: ${completadas}/${total} (vence ${act.fecha_limite})\n`;
    }

    resumen += `\n${data.estadisticas.completadas}/${data.estadisticas.total} completadas`;
    log(resumen);

  } else {
    log('Uso:');
    log('  node scripts/moodle_sena_tracker.js ver          - Ver todas las actividades');
    log('  node scripts/moodle_sena_tracker.js completar ID  - Marcar/desmarcar evidencia');
    log('  node scripts/moodle_sena_tracker.js resumen       - Resumen para Telegram');
  }
}

run();

