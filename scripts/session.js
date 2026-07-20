/**
 * scripts/session.js — LifeOS on-demand (sin PM2, sin PC 24/7)
 *
 * Úsalo 1–2 veces al día cuando te sientes a organizar.
 * Corre scrapers ligeros + briefing y SALE. No deja daemons.
 *
 * Uso:
 *   npm run session              # rutina completa de sesión
 *   npm run session -- --fast    # solo briefing (sin scrapers)
 *   npm run session -- --no-jobs # sin scrapers de empleo
 *   npm run session -- --dry-run # imprime plan, no ejecuta
 */
'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const FAST = process.argv.includes('--fast');
const NO_JOBS = process.argv.includes('--no-jobs');

function log(msg) {
  console.log(`[session ${new Date().toLocaleTimeString('es-CO', { hour12: false })}] ${msg}`);
}

function run(relPath, { tsx = false, optional = false, args = [] } = {}) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    if (optional) {
      log(`⏭  opcional ausente: ${relPath}`);
      return true;
    }
    log(`❌ no existe: ${relPath}`);
    return false;
  }
  if (DRY) {
    log(`🔍 [dry-run] ${tsx ? 'tsx' : 'node'} ${relPath} ${args.join(' ')}`);
    return true;
  }
  log(`▶  ${relPath}${args.length ? ' ' + args.join(' ') : ''}`);
  const cmd = tsx ? 'npx' : process.execPath;
  const cmdArgs = tsx ? ['tsx', full, ...args] : [full, ...args];
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    timeout: 300_000,
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    log(`⚠  falló (${r.status}): ${relPath} — continúo`);
    return false;
  }
  log(`✅ ${relPath}`);
  return true;
}

function banner() {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   LifeOS SESSION (on-demand, sin PM2)      ║
  ║   1–2 veces al día · corre y termina       ║
  ╚════════════════════════════════════════════╝
  `);
}

async function main() {
  banner();
  const t0 = Date.now();
  const day = new Date().getDay(); // 0=dom … 6=sáb
  const isMonday = day === 1;
  const isWeekday = day >= 1 && day <= 5;

  if (FAST) {
    log('Modo --fast: solo briefing');
    run('scripts/schedulers/morning_briefing.ts', { tsx: true });
    log(`Listo en ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    return;
  }

  // 1) Correo — ver qué llegó
  log('═══ CORREO ═══');
  run('scripts/integrations/email_processor.js', { optional: true });
  run('scripts/integrations/inbox_sensor.js', { optional: true });

  // 2) Estudio / SENA
  log('═══ SENA ═══');
  run('scripts/integrations/moodle_sena_scraper.js', { optional: true });
  run('scripts/integrations/moodle_sena_tracker.js', { optional: true });

  // 3) Tránsito (rápido si ya hay sesión/cache)
  log('═══ SIMIT ═══');
  run('scripts/integrations/simit_scraper.js', { optional: true });

  // 4) DIAN solo lunes (pesado)
  if (isMonday) {
    log('═══ DIAN (lunes) ═══');
    run('scripts/integrations/dian_scraper.js', { optional: true });
  }

  // 5) Empleo: scrape + cola, NUNCA auto-apply en sesión
  if (isWeekday && !NO_JOBS) {
    log('═══ EMPLEO (semi-auto) ═══');
    run('scripts/jobs/computrabajo_scraper.js', { optional: true });
    run('scripts/jobs/job_loop.js', { optional: true, args: ['--dry-run', '--loops=1'] });
    run('scripts/jobs/computrabajo_apply.js', { optional: true, args: ['--dry-run'] });
  }

  // 6) Vehículo (SOAT / recordatorios locales)
  log('═══ VEHÍCULO ═══');
  run('scripts/schedulers/vehicle_manager.js', { optional: true });

  // 7) Contexto + briefing (consola + Telegram si hay token)
  log('═══ BRIEFING ═══');
  run('scripts/schedulers/context_engine_daily.js', { optional: true });
  run('scripts/schedulers/morning_briefing.ts', { tsx: true });

  const sec = ((Date.now() - t0) / 1000).toFixed(0);
  log('════════════════════════════════════');
  log(`Sesión terminada en ${sec}s. Sin daemons. PC libre.`);
  log('Postular jobs a mano: node scripts/jobs/job_loop.js --auto');
  log('Solo briefing: npm run session -- --fast');
}

main().catch((e) => {
  console.error('session fatal:', e.message);
  process.exit(1);
});
