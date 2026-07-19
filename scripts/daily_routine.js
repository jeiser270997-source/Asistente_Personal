/**
 * scripts/daily_routine.js
 *
 * ☀️ LIFEOS — RUTINA MATUTINA (5:00 AM)
 *
 * Arquitectura "Run & Die": la BIOS enciende la PC → Windows arranca →
 * este script ejecuta todo secuencialmente → envía briefing a Telegram →
 * apaga la PC. Cero orphan jobs, cero procesos colgados, cero PM2.
 *
 * 🔧 Modo testing: cambiar SHUTDOWN_AFTER_RUN = false
 *
 * Dependencias:
 *   - .env con TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   - playground headless: chromium, firefox o webkit
 *   - conexión a internet
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { sendTelegramMessage } = require('../lib/integrations/telegram');  // ── CONFIGURACIÓN ────────────────────────────────────────────────────────────
  const DRY_RUN = process.argv.includes('--dry-run');
  const SHUTDOWN_AFTER_RUN = !process.argv.includes('--no-shutdown') && !DRY_RUN;
  const SHUTDOWN_DELAY_S  = 60;     // segundos antes de apagar
  const ROOT_DIR = path.resolve(__dirname, '..');

// ── HELPERS ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toLocaleTimeString('es-CO', { hour12: false });
}

function log(msg) {
  console.log(`[${timestamp()}] ${msg}`);
}

/**
 * Cross-platform wait (Windows `timeout`, Linux/macOS `sleep`)
 */
function wait(seconds) {
  try {
    // Windows: timeout /t (no errorlevel, no interactive prompt)
    execSync(`timeout /t ${Math.floor(seconds)} /nobreak >nul 2>&1`, { stdio: 'ignore', timeout: (seconds + 5) * 1000 });
  } catch {
    try {
      // Fallback: node inline sleep
      const start = Date.now();
      while (Date.now() - start < seconds * 1000) { /* busy-wait fallback */ }
    } catch {}
  }
}

function banner() {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   ☀️  LIFEOS — RUTINA MATUTINA (5:00 AM) ║
  ║   Arquitectura: Run & Die                ║
  ╚══════════════════════════════════════════╝
  `);
}

/**
 * Ejecuta un script secuencialmente.
 * Si falla, registra el error pero CONTINÚA con el siguiente.
 * Los scrapers críticos tienen reintento automático.
 */  function runScript(scriptPath, interpreter = process.execPath, retries = 0) {
    const fullPath = path.join(ROOT_DIR, scriptPath);
    if (!fs.existsSync(fullPath)) {
      log(`⚠️  Script no encontrado: ${scriptPath} — saltando`);
      return false;
    }

    if (DRY_RUN) {
      log(`🔍 [DRY-RUN] Se ejecutaría: ${scriptPath} (retries: ${retries})`);
      return true;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      log(`🚀 Ejecutando: ${scriptPath}${retries > 0 ? ` (intento ${attempt + 1}/${retries + 1})` : ''}`);
      execSync(`${interpreter} "${fullPath}"`, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        timeout: 300_000, // 5 min por script
      });
      log(`✅ Completado: ${scriptPath}`);
      return true;
    } catch (err) {
      const msg = err.message || 'unknown error';
      log(`❌ Error en ${scriptPath}: ${msg.substring(0, 120)}`);
      if (attempt < retries) {
        const waitMs = (attempt + 1) * 5000;
        log(`   Reintentando en ${waitMs / 1000}s...`);
        wait(waitMs / 1000);
      }
    }
  }
  return false;
}

/**
 * Helper para scripts TypeScript (usando tsx)
 */
function runTS(scriptPath) {
  return runScript(scriptPath, 'npx tsx', 1);
}

/**
 * Envía un mensaje a Telegram. No falla si no hay token.
 */
async function notify(text) {
  try {
    await sendTelegramMessage(`💤 ${text}`);
  } catch {
    log('   (Telegram no disponible para notificación)');
  }
}

/**
 * Limpia orphan jobs en la base de datos
 * Jobs que quedaron en estado 'running' de ejecuciones previas
 */
function fixOrphanJobs() {
  try {
    log('🧹 Limpiando orphan jobs en SQLite...');
    process.env.STORAGE_DRIVER = 'sqlite';
    const { getDb, close } = require('../runtime/stores/Database');
    const orphans = getDb().prepare("UPDATE job_runs SET status = 'failed', finished_at = datetime('now') WHERE status = 'running'").run();
    if (orphans.changes > 0) {
      log(`   ✅ ${orphans.changes} orphan job(s) limpiados`);
    } else {
      log('   ✅ Sin orphan jobs pendientes');
    }
    close();
    delete process.env.STORAGE_DRIVER; // cleanup
  } catch (err) {
    log(`   ⚠️  Error limpiando orphans: ${err.message}`);
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  banner();
  const startTime = Date.now();
  const today = new Date();
  const isMonday = today.getDay() === 1;
  const isWeekday = today.getDay() >= 1 && today.getDay() <= 5;

  // Fase 0: Sanitizar orphan jobs del día anterior
  // (si la PC se apagó en caliente, estos jobs quedaron colgados)
  fixOrphanJobs();

  // ═══════════════════════════════════════════════
  // Fase 1: Limpieza y Sensores
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 1: CORREOS ═══════════');
  runScript('scripts/integrations/email_processor.js');

  // ═══════════════════════════════════════════════
  // Fase 2: Scrapers de Datos
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 2: SCRAPERS ═══════════');
  runScript('scripts/integrations/simit_scraper.js', 'node', 1);       // 1 reintento
  runScript('scripts/integrations/moodle_sena_scraper.js', 'node', 1); // 1 reintento
  runScript('scripts/integrations/moodle_sena_tracker.js');

  // DIAN solo los lunes
  if (isMonday) {
    log('   📅 Lunes — ejecutando DIAN scraper...');
    runScript('scripts/integrations/dian_scraper.js', 'node', 1);
  } else {
    log('   📅 No es lunes — saltando DIAN scraper');
  }

  // Simit recordatorio (vía recordatorio_deepseek si existe)
  if (fs.existsSync(path.join(ROOT_DIR, 'scripts', 'integrations', 'recordatorio_deepseek.js'))) {
    runScript('scripts/integrations/recordatorio_deepseek.js');
  }

  // ═══════════════════════════════════════════════
  // Fase 3: Pipeline de Empleo (días laborales)
  // ═══════════════════════════════════════════════
  if (isWeekday) {
    log('═══════════ FASE 3: EMPLEO ═══════════');
    runScript('scripts/jobs/computrabajo_scraper.js', 'node', 1);
    // apply en modo semi-auto por defecto (necesita aprobación Telegram)
    runScript('scripts/jobs/computrabajo_apply.js');
  } else {
    log('═══════════ FASE 3: EMPLEO (skip — fin de semana) ═══════════');
  }

  // ═══════════════════════════════════════════════
  // 🆕 Fase 3.5: Event Worker (drenar eventos de scrapers y empleo)
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 3.5: EVENT WORKER ═══════════');
  runScript('scripts/maintenance/event_worker.js');

  // ═══════════════════════════════════════════════
  // Fase 4: Mantenimiento
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 4: MANTENIMIENTO ═══════════');
  runScript('scripts/schedulers/vehicle_manager.js');
  runScript('scripts/maintenance/document_pipeline.js');

  // ═══════════════════════════════════════════════
  // Fase 5: Backups
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 5: BACKUPS ═══════════');
  runTS('scripts/maintenance/backup_dbs.ts');

  // ═══════════════════════════════════════════════
  // 🆕 Fase 5.5: Event Worker (drenar eventos de mantenimiento y backups)
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 5.5: EVENT WORKER ═══════════');
  runScript('scripts/maintenance/event_worker.js');

  // ═══════════════════════════════════════════════
  // Fase 6: Contexto y Briefing
  // ═══════════════════════════════════════════════
  log('═══════════ FASE 6: BRIEFING ═══════════');
  runScript('scripts/schedulers/context_engine_daily.js');
  runTS('scripts/schedulers/morning_briefing.ts');  // envía el briefing a Telegram

  // ═══════════════════════════════════════════════
  // Resumen Final
  // ═══════════════════════════════════════════════
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  log('═══════════ ✅ RUTINA COMPLETADA ═══════════');
  log(`⏱️  Tiempo total: ${elapsed}s`);
  log(`💾 Estado: ${SHUTDOWN_AFTER_RUN ? 'Apagando equipo...' : 'Modo TEST — sin apagar'}`);

  // Notificar a Telegram
  try {
    await notify(
      `✅ Rutina matutina LifeOS completada en ${elapsed}s.\n` +
      `💻 Equipo actualizado y listo.\n` +
      (SHUTDOWN_AFTER_RUN
        ? `🔌 Apagando en ${SHUTDOWN_DELAY_S}s... ¡Buen turno en DiDi! 🚕`
        : `🧪 Modo TEST — PC no se apaga. Revisa logs.`)
    );
  } catch (err) {
    log(`   ⚠️  No se pudo enviar notificación Telegram: ${err.message}`);
  }

  // ═══════════════════════════════════════════════
  // Fase 7: Matar zombies de Playwright (solo en modo produccion)
  // ═══════════════════════════════════════════════
  if (SHUTDOWN_AFTER_RUN) {
    log('🧟 Matando procesos zombie de navegadores...');
    try {
      execSync('taskkill /F /IM chrome.exe /IM msedge.exe /T', { stdio: 'ignore', timeout: 5000 });
      log('   ✅ Navegadores zombie eliminados');
    } catch {
      log('   ✅ No habia procesos de navegador que matar');
    }
  } else {
    log('🧪 Modo TEST — no se matan navegadores');
  }

  // ═══════════════════════════════════════════════
  // Fase 8: Apagar la PC
  // ═══════════════════════════════════════════════
  if (SHUTDOWN_AFTER_RUN) {
    log(`🔌 Apagando equipo en ${SHUTDOWN_DELAY_S} segundos...`);
    log('   (Ejecuta: Ctrl+C para cancelar)');
    try {
      execSync(`shutdown /s /t ${SHUTDOWN_DELAY_S} /c "LifeOS: Rutina matutina completada. Hasta mañana."`, {
        stdio: 'inherit',
        timeout: 10000,
      });
    } catch (err) {
      log(`   ⚠️  Error al apagar: ${err.message}`);
      log('   (Puedes apagar manualmente)');
    }
  } else {
    log('🛑 Modo TEST activo. PC NO se apagará.');
    log('   Cambia SHUTDOWN_AFTER_RUN = true cuando estés listo.');
  }
}

// ── EXEC ─────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error(`\n💥 FATAL: ${err.message}`);
  process.exit(1);
});
