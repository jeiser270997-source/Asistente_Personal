/**
 * scripts/morning_wake.js — Rutina 5:00 AM (wake from sleep)
 *
 * Diseñada para Task Scheduler + PC en sleep:
 *  1. Espera red (post-wake)
 *  2. Clima AHORA vs tarde (Open-Meteo, sin key)
 *  3. PyP, SIMIT/SENA/empleo desde CACHE (sin scrapers pesados por defecto)
 *  4. Briefing determinista → consola + Telegram
 *  5. NO apaga la PC. NO depende de LLM free-tier.
 *
 * Uso:
 *   node scripts/morning_wake.js
 *   node scripts/morning_wake.js --full     # + email + scrapers ligeros (timeout)
 *   node scripts/morning_wake.js --llm      # intenta embellecer con LLM (opcional)
 *   node scripts/morning_wake.js --shutdown # apagar al final (opt-in)
 *
 * Task Scheduler: apunta aquí en vez de daily_routine.js
 */
'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getMedellinWeatherDetailed, formatWeatherMarkdown } = require('../lib/integrations/weather_client');

const ROOT = path.resolve(__dirname, '..');
const FULL = process.argv.includes('--full');
const USE_LLM = process.argv.includes('--llm');
const DO_SHUTDOWN = process.argv.includes('--shutdown');
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
  // Medellín 2026-ish digits (mismo default que briefing)
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const col = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const dayName = days[col.getDay()];
  const placa = (process.env.USER_PLATE || 'KEW496').replace(/\D/g, '').slice(-1) || '6';
  let table = {
    Lunes: ['5', '8'],
    Martes: ['1', '4'],
    Miercoles: ['2', '0'],
    Jueves: ['3', '6'],
    Viernes: ['7', '9'],
  };
  const picoFile = path.join(ROOT, 'data', 'pico_placa.json');
  const didiCfg = path.join(ROOT, 'data', 'config', 'didi_config.json');
  try {
    if (fs.existsSync(picoFile)) table = { ...table, ...JSON.parse(fs.readFileSync(picoFile, 'utf8')) };
    if (fs.existsSync(didiCfg)) {
      const d = JSON.parse(fs.readFileSync(didiCfg, 'utf8'));
      if (d.pico_y_placa_medellin) {
        const m = d.pico_y_placa_medellin;
        table = {
          Lunes: m.lunes || table.Lunes,
          Martes: m.martes || table.Martes,
          Miercoles: m.miercoles || table.Miercoles,
          Jueves: m.jueves || table.Jueves,
          Viernes: m.viernes || table.Viernes,
        };
      }
    }
  } catch { /* ignore */ }
  const rest = table[dayName] || [];
  const applies = rest.map(String).includes(String(placa));
  return { dayName, placa, rest, applies };
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
  const pypLine = pyp.applies
    ? `🚫 *Pico y placa APLICA* (placa …${pyp.placa}; hoy ${pyp.rest.join(' y ')}) → prioriza estudio/empleo, no DiDi carro`
    : `✅ Pico y placa NO aplica (placa …${pyp.placa}; hoy restringen ${pyp.rest.join(' y ') || 'n/a'})`;

  const isSat = dayName === 'Sabado';
  const agenda = isSat
    ? [
        '1. *CESDE 07:30–18:00* (prioridad absoluta)',
        '2. SENA solo si sobra energía',
        '3. Sin forzar DiDi',
      ]
    : [
        '1. Revisa SENA críticos (si hay)',
        '2. DiDi AM fresco (si no PyP) · meta parcial',
        '3. 10:30–15:30: *NO conducir* (calor) → estudio/correos',
        '4. DiDi PM',
        '5. Empleo: cola semi-auto; postular solo a mano',
      ];

  return [
    '☕ *LIFEOS DESPERTAR*',
    `📅 ${dayName} ${todayIso} · 5am wake`,
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
    '🎯 *PLAN MAÑANA*',
    ...agenda,
    '',
    '_Datos: clima Open-Meteo (AHORA + horas). Sin LLM free-tier. PC no se apaga._',
  ].join('\n');
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

  // Log local
  try {
    const logDir = path.join(ROOT, 'data', 'state', 'audit');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(
      path.join(logDir, 'last_morning_wake.json'),
      JSON.stringify({ at: new Date().toISOString(), weather, pyp, full: FULL }, null, 2)
    );
  } catch { /* ignore */ }

  if (DO_SHUTDOWN && !DRY) {
    log('Apagando en 60s (--shutdown)…');
    spawnSync('shutdown', ['/s', '/t', '60', '/c', 'LifeOS morning_wake done'], { shell: true });
  } else {
    log('Listo. PC sigue encendida (default). Apaga tú o usa --shutdown.');
  }
}

main().catch((e) => {
  console.error('morning_wake fatal:', e);
  process.exit(1);
});
