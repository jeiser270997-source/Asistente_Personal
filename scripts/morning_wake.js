/**
 * scripts/morning_wake.js — ÚNICO proceso automático de LifeOS
 *
 * PC en sleep → Task Scheduler 5:00 → despierta → informe Telegram → vuelve a sleep.
 * (A las 2am hay otra actividad del usuario; la PC debe quedar en sleep, no apagada.)
 *
 *  1. Espera red post-wake
 *  2. Clima AHORA (Open-Meteo, sin key, sin LLM)
 *  3. Pico y placa (pico_placa.json — desde 2026-08-04 dígito 6 = lunes 5–20h)
 *  4. Caches SIMIT/SENA/empleo
 *  5. Telegram
 *  6. Sleep de nuevo (default). --no-sleep para dejarla encendida.
 *
 * Uso:
 *   node scripts/morning_wake.js
 *   node scripts/morning_wake.js --no-sleep
 *   node scripts/morning_wake.js --full   # + email reglas (sin LLM)
 */
'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getMedellinWeatherDetailed, formatWeatherMarkdown } = require('../lib/integrations/weather_client');
const { getPicoYPlacaStatus } = require('../lib/integrations/pico_placa');

const ROOT = path.resolve(__dirname, '..');
const FULL = process.argv.includes('--full');
const USE_LLM = process.argv.includes('--llm');
const DO_SHUTDOWN = process.argv.includes('--shutdown');
const NO_SLEEP = process.argv.includes('--no-sleep');
const DO_SLEEP = !NO_SLEEP && !DO_SHUTDOWN && !process.argv.includes('--dry-run');
const DRY = process.argv.includes('--dry-run');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function log(msg) {
  console.log(`[wake ${new Date().toLocaleTimeString('es-CO', { hour12: false })}] ${msg}`);
}

async function waitForNetwork(maxMs = 90_000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxMs) {
    attempt++;
    try {
      const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=6.25&longitude=-75.56&current=temperature_2m', {
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        log(`Red OK (intento ${attempt})`);
        return true;
      }
    } catch {
      log(`Esperando red post-sleep… (${attempt})`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  log('⚠ Red no respondió a tiempo — briefing con caches locales');
  return false;
}

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    log('Telegram no configurado — solo consola');
    return false;
  }
  if (DRY) {
    log('[dry-run] Telegram omitido');
    return true;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text.slice(0, 4000),
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      log(`Telegram HTTP ${res.status}: ${body.slice(0, 120)}`);
      // retry without markdown
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text.replace(/[*_`]/g, '').slice(0, 4000) }),
        signal: AbortSignal.timeout(15_000),
      });
    }
    return true;
  } catch (e) {
    log(`Telegram error: ${e.message}`);
    return false;
  }
}

function getPicoYPlaca() {
  return getPicoYPlacaStatus();
}

function getSimitCache() {
  const p = path.join(ROOT, 'data', 'cache', 'simit_multas.json');
  try {
    if (!fs.existsSync(p)) return 'ℹ️ SIMIT: sin cache (corre scraper en sesión diurna si necesitas fresco)';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j.total_deuda_activa > 0) {
      return `⚠️ SIMIT deuda activa: $${Number(j.total_deuda_activa).toLocaleString('es-CO')}`;
    }
    return '✅ SIMIT: sin deuda en último cache';
  } catch {
    return 'ℹ️ SIMIT: cache ilegible';
  }
}

function getSenaHint() {
  const alertas = path.join(ROOT, 'data', 'state', 'contexto_maestro', 'ALERTAS_SENA.md');
  try {
    if (!fs.existsSync(alertas)) return 'ℹ️ SENA: sin ALERTAS_SENA.md';
    const t = fs.readFileSync(alertas, 'utf8');
    const crit = t.split('\n').filter((l) => /CRÍTICO|venc|dias\)|🔴|ðŸ”´/i.test(l)).slice(0, 6);
    if (!crit.length) return '✅ SENA: sin líneas críticas obvias en alertas';
    return '🚨 SENA (de alertas):\n' + crit.map((l) => `  ${l.replace(/^#+\s*/, '').slice(0, 120)}`).join('\n');
  } catch {
    return 'ℹ️ SENA: no leído';
  }
}

function getJobsHint() {
  const q = path.join(ROOT, 'data', 'jobs', 'apply_queue.json');
  try {
    if (!fs.existsSync(q)) return 'ℹ️ Empleo: sin cola';
    const raw = JSON.parse(fs.readFileSync(q, 'utf8'));
    const list = Array.isArray(raw) ? raw : (raw.ofertas || raw.queue || []);
    return `💼 Empleo: ${list.length} en cola (semi-auto — no se postulan solas)`;
  } catch {
    return 'ℹ️ Empleo: n/a';
  }
}

function getTrafficHint() {
  // Sin TomTom key no inventamos. Heurística DiDi Medellín.
  const hour = Number(
    new Date().toLocaleString('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false })
  );
  const lines = ['🚧 *TRÁFICO (heurística Medellín, sin API de pago)*'];
  if (hour >= 5 && hour < 9) {
    lines.push('• Pico mañana: salir temprano a hubs (Poblado/Laureles) si vas DiDi AM');
  } else if (hour >= 16 && hour < 20) {
    lines.push('• Pico tarde: expect retrasos 17–19h en avenidas principales');
  } else {
    lines.push('• Fuera de pico típico; valida Waze al salir si hay lluvia');
  }
  if (!process.env.TOMTOM_API_KEY) {
    lines.push('• TomTom no configurado — no hay tiempos en vivo (OK, es opcional)');
  }
  return lines.join('\n');
}

function buildMessage({ weatherMd, pyp, simit, sena, jobs, traffic, todayIso, dayName }) {
  const pypLine = pyp.message || (
    pyp.applies
      ? `🚫 Pico y placa hoy (…${pyp.placa}) ${pyp.hours?.start || '05:00'}–${pyp.hours?.end || '20:00'}`
      : `✅ Sin pico y placa (…${pyp.placa})`
  );

  const isSat = dayName === 'Sabado';
  const noDidiCar = pyp.applies;
  const agenda = isSat
    ? [
        '1. *CESDE 07:30–18:00* (prioridad absoluta)',
        '2. SENA solo si sobra energía',
        '3. Sin forzar DiDi',
      ]
    : noDidiCar
      ? [
          '1. 🚫 Hoy PyP carro — *no DiDi en Corolla* (5am–8pm)',
          '2. SENA / estudio / correos (con agente DeepSeek si quieres)',
          '3. Empleo: revisar cola; postular solo a mano',
          '4. Alarmas: las pones tú (Calendar LifeOS desactivado)',
        ]
      : [
          '1. SENA críticos (si hay)',
          '2. DiDi AM fresco · meta parcial',
          '3. 10:30–15:30: *NO conducir* (calor) → estudio',
          '4. DiDi PM',
          '5. Empleo semi-auto; postular solo a mano',
        ];

  return [
    '☕ *LIFEOS DESPERTAR*',
    `📅 ${dayName} ${todayIso} · auto 5am → sleep`,
    '',
    weatherMd,
    '',
    '🚗 *MOVILIDAD*',
    `• ${pypLine}`,
    '• Moto BXU28C: SOAT/RTM vencidos — *NO circular*',
    `• ${simit}`,
    '',
    traffic,
    '',
    sena,
    '',
    jobs,
    '',
    '🎯 *PLAN*',
    ...agenda,
    '',
    '_Clima Open-Meteo · sin LLM · sin Calendar · PC vuelve a sleep._',
  ].join('\n');
}

/**
 * Vuelve a SLEEP (no apagar, no hibernar).
 * Orden de intentos: PowerShell Suspend → rundll32 → powercfg (último).
 */
function goToSleep({ delaySec = 8 } = {}) {
  const auditPath = path.join(ROOT, 'data', 'state', 'audit', 'last_morning_wake.json');
  try {
    let prev = {};
    if (fs.existsSync(auditPath)) prev = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    prev.sleepAt = new Date().toISOString();
    prev.sleepRequested = true;
    fs.mkdirSync(path.dirname(auditPath), { recursive: true });
    fs.writeFileSync(auditPath, JSON.stringify(prev, null, 2));
  } catch { /* ignore */ }

  log(`Volviendo a SLEEP en ${delaySec}s (no apaga; 2am sigue posible)…`);
  try {
    spawnSync(process.env.ComSpec || 'cmd.exe', ['/c', `timeout /t ${delaySec} /nobreak >nul`], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } catch { /* ignore */ }

  // 1) .NET Suspend (sleep, force=false, disableWakeEvent=false)
  const ps = [
    "Add-Type -AssemblyName System.Windows.Forms;",
    "$r = [System.Windows.Forms.Application]::SetSuspendState(",
    "  [System.Windows.Forms.PowerState]::Suspend, $false, $false);",
    "if (-not $r) { exit 2 } else { exit 0 }",
  ].join(' ');

  let r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
    windowsHide: true,
    timeout: 60_000,
  });
  if (r.status === 0) {
    log('Sleep OK (System.Windows.Forms Suspend)');
    return true;
  }
  log(`⚠ Forms Suspend status=${r.status}; fallback rundll32…`);

  // 2) rundll32: 0=sleep not hibernate, 1=force, 0=disable wake events
  r = spawnSync('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0'], {
    windowsHide: true,
    timeout: 30_000,
  });
  // rundll32 often returns 0 even when queued
  log(`rundll32 sleep invocado (code=${r.status ?? 'n/a'})`);
  return true;
}

function runOptional(rel, timeoutMs = 120_000) {
  if (DRY) {
    log(`[dry-run] skip ${rel}`);
    return;
  }
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    log(`skip missing ${rel}`);
    return;
  }
  log(`▶ ${rel} (timeout ${timeoutMs / 1000}s)`);
  const r = spawnSync(process.execPath, [full], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    timeout: timeoutMs,
  });
  if (r.error) log(`⚠ ${rel}: ${r.error.message}`);
  else if (r.status !== 0) log(`⚠ ${rel} exit ${r.status}`);
  else log(`✅ ${rel}`);
}

async function main() {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║  LifeOS MORNING WAKE (5am, lean)         ║
  ║  sin LLM obligatorio · sin apagado       ║
  ╚══════════════════════════════════════════╝
  `);

  await waitForNetwork();

  if (FULL) {
    log('Modo --full: email + sena tracker (timeouts cortos)');
    runOptional('scripts/integrations/email_processor.js', 180_000);
    runOptional('scripts/integrations/moodle_sena_tracker.js', 180_000);
  }

  const col = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const dayName = days[col.getDay()];
  const todayIso = col.toISOString().split('T')[0];

  log('Clima Open-Meteo…');
  const weather = await getMedellinWeatherDetailed();
  const weatherMd = formatWeatherMarkdown(weather);

  const pyp = getPicoYPlaca();
  const simit = getSimitCache();
  const sena = getSenaHint();
  const jobs = getJobsHint();
  const traffic = getTrafficHint();

  let msg = buildMessage({ weatherMd, pyp, simit, sena, jobs, traffic, todayIso, dayName });

  // LLM opcional — si free-tier truena, se ignora
  if (USE_LLM) {
    try {
      const { askLLM } = require('../lib/ai/llm_service');
      const res = await askLLM(
        'Resume en español el briefing matutino. NO inventes clima ni tráfico. Conserva datos numéricos. Máx 25 líneas Markdown Telegram.',
        [{ role: 'user', content: msg }],
        0.1
      );
      if (res?.content && res.content.length > 80) {
        msg = res.content.replace(/```/g, '').trim();
        log('LLM embelleció el mensaje');
      }
    } catch (e) {
      log(`LLM omitido (free-tier/error): ${e.message.slice(0, 100)}`);
    }
  }

  console.log('\n' + msg.replace(/\*/g, '') + '\n');
  await sendTelegram(msg);

  // Log local (antes del sleep)
  const audit = {
    at: new Date().toISOString(),
    ok: true,
    weatherOk: !!(weather && weather.ok),
    telegramConfigured: !!(TELEGRAM_TOKEN && CHAT_ID),
    pypApplies: !!(pyp && pyp.applies),
    pypMessage: pyp && pyp.message,
    full: FULL,
    willSleep: DO_SLEEP,
    sleepRequested: false,
  };
  try {
    const logDir = path.join(ROOT, 'data', 'state', 'audit');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, 'last_morning_wake.json'), JSON.stringify(audit, null, 2));
  } catch { /* ignore */ }

  if (DO_SHUTDOWN && !DRY) {
    log('Apagando en 60s (--shutdown)…');
    spawnSync('shutdown', ['/s', '/t', '60', '/c', 'LifeOS morning_wake done'], { shell: true });
  } else if (DO_SLEEP) {
    log('Informe listo → sleep. --no-sleep para dejar encendida.');
    goToSleep({ delaySec: 8 });
  } else {
    log('Listo. PC sigue encendida (--no-sleep o dry-run). Sleep path NO ejecutado.');
    log('Para producción 5am: sin flags → sleep automático.');
  }

  process.exitCode = 0;
}

main().catch((e) => {
  console.error('morning_wake fatal:', e);
  try {
    const logDir = path.join(ROOT, 'data', 'state', 'audit');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(
      path.join(logDir, 'last_morning_wake.json'),
      JSON.stringify({ at: new Date().toISOString(), ok: false, error: String(e.message || e) }, null, 2)
    );
  } catch { /* ignore */ }
  process.exit(1);
});
