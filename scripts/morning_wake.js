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
const { getPicoYPlacaStatus, getLivePicoYPlacaStatus } = require('../lib/integrations/pico_placa');

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
      const res2 = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: text.replace(/[*_`]/g, '').slice(0, 4000) }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res2.ok) {
        log(`Telegram fallback también falló: ${res2.status}`);
        return false;
      }
      log('Telegram OK (texto plano)');
      return true;
    }
    log('Telegram OK (Markdown)');
    return true;
  } catch (e) {
    log(`Telegram error: ${e.message}`);
    return false;
  }
}

async function getPicoYPlaca() {
  return await getLivePicoYPlacaStatus();
}

function getPlateDigit() {
  const pypPath = path.join(ROOT, 'data', 'pico_placa.json');
  try {
    if (fs.existsSync(pypPath)) {
      return JSON.parse(fs.readFileSync(pypPath, 'utf8')).placa_last_digit || '6';
    }
  } catch {}
  return '6';
}

function getSimitCache() {
  const p = path.join(ROOT, 'data', 'cache', 'simit_multas.json');
  try {
    if (!fs.existsSync(p)) return 'ℹ️ SIMIT: sin cache (corre scraper en sesión diurna si necesitas fresco)';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j.total_deuda_activa > 0) {
      return `⚠️ SIMIT deudor activo: $${Number(j.total_deuda_activa).toLocaleString('es-CO')}`;
    }
    return '✅ SIMIT: sin deudas en último cache';
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

async function getTrafficHint() {
  if (process.env.TOMTOM_API_KEY) {
    try {
      const { getTrafficReport } = require('../lib/integrations/tomtom_client');
      const report = await getTrafficReport();
      return report;
    } catch (e) {
      return `🚧 *TRÁFICO:* Error cargando reporte en vivo (${e.message})`;
    }
  }
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
  lines.push('• TomTom no configurado — no hay tiempos en vivo (OK, es opcional)');
  return lines.join('\n');
}

async function getDynamicHoliday(todayIso) {
  try {
    const year = todayIso.split('-')[0];
    const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/CO`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const holidays = await res.json();
      
      // 1. ¿Hoy es festivo?
      const todayHoliday = holidays.find(h => h.date === todayIso);
      
      // 2. ¿Hay festivos en los próximos 7 días?
      const today = new Date(todayIso + 'T00:00:00-05:00');
      const limit = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const nextHolidays = holidays.filter(h => {
        const hDate = new Date(h.date + 'T00:00:00-05:00');
        return hDate > today && hDate <= limit;
      });

      return {
        today: todayHoliday ? todayHoliday.localName : null,
        upcoming: nextHolidays.map(h => ({ name: h.localName, date: h.date }))
      };
    }
  } catch {}
  return { today: null, upcoming: [] };
}

async function getTrm() {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return data.usd?.cop ? Math.round(data.usd.cop) : null;
    }
  } catch {}
  return null;
}

async function getHnTopPost() {
  try {
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(5000) });
    if (topRes.ok) {
      const [topId] = await topRes.json();
      const detailRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${topId}.json`, { signal: AbortSignal.timeout(5000) });
      if (detailRes.ok) {
        const topPost = await detailRes.json();
        return { title: topPost.title, url: topPost.url || `https://news.ycombinator.com/item?id=${topId}` };
      }
    }
  } catch {}
  return null;
}

function getQuincenaSignal(date) {
  const day = date.getDate();
  const esQuincena = (day >= 14 && day <= 17) || (day >= 29) || (day <= 2);
  if (esQuincena) {
    return '• 💵 *Efecto Quincena:* Mayor liquidez en Medellín. Los usuarios pagan tarifas dinámicas más fácil. Prioriza viajes con multiplicador.';
  }
  return '• 📉 *Fin de Quincena:* Presupuestos ajustados. Los usuarios cuidan más el bolsillo; prefiere volumen rápido y no rechaces tarifas aceptables.';
}

function getEstiTime(delay, isRaining) {
  const meta = 260000;
  let ratePerHour = 30000;
  
  if (delay >= 12 && isRaining) {
    ratePerHour = 20000; // colapso total
  } else if (delay >= 12) {
    ratePerHour = 24000; // taco pesado
  } else if (isRaining) {
    ratePerHour = 32000; // alta demanda sin congestión en tu ruta habitual
  } else {
    ratePerHour = 30000;
  }
  
  return {
    hours: (meta / ratePerHour).toFixed(1),
    rate: ratePerHour
  };
}

async function getDidiStrategy(dayIndex, pyp, weather, upcomingHolidays) {
  const placa = getPlateDigit();
  const colDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  
  // Sábado: CESDE
  if (dayIndex === 6) {
    return '🎓 *ESTRATEGIA DIDI SÁBADO:* Hoy priorizas CESDE presencial de 7:30 AM a 6:00 PM. No programes turnos DiDi; descansa o haz viajes cortos de regreso si te queda energía.';
  }
  
  // Domingo: Familiar
  if (dayIndex === 0) {
    return '⚽ *ESTRATEGIA DIDI DOMINGO:* Mañana familiar y fútbol de Dominick. DiDi opcional en la tarde-noche si deseas complementar la meta semanal.';
  }

  // Si tiene Pico y Placa hoy (lunes)
  if (pyp.applies) {
    return `🚫 *ESTRATEGIA DIDI:* Hoy tienes Pico y Placa (placa …${placa}). El Corolla no puede circular de 5:00 AM a 8:00 PM. Aprovecha el bloque libre para estudiar SENA/bootcamp o adelantar tareas.`;
  }

  // Días de semana sin Pico y Placa (Martes - Viernes)
  let tomtomMetrics = null;
  if (process.env.TOMTOM_API_KEY) {
    try {
      const { getRouteMetrics, HUBS } = require('../lib/integrations/tomtom_client');
      tomtomMetrics = await getRouteMetrics(HUBS.LA_ESTRELLA, HUBS.EL_POBLADO);
    } catch {}
  }

  const isRaining = weather?.now?.rainLikely || (weather?.now?.precipMm > 0);
  const delay = (tomtomMetrics && tomtomMetrics.ok) ? (tomtomMetrics.delayMin || 0) : 0;
  
  const qSignal = getQuincenaSignal(colDate);
  const est = getEstiTime(delay, isRaining);

  const lines = ['🚕 *ESTRATEGIA DIDI (Salida 8:30 AM desde Villa Eloisa)*'];

  if (isRaining) {
    lines.push('• ☔ *Día lluvioso:* La demanda de viajes cortos en el sur (Sabaneta, Itagüí, Envigado) subirá fuerte. Quédate en zonas residenciales. Conduce con cuidado y evita deprimidos inundables.');
  } else {
    lines.push('• ☀️ *Clima seco:* Demanda normal.');
  }

  // Analizar tráfico real de TomTom
  if (tomtomMetrics && tomtomMetrics.ok) {
    if (delay >= 12) {
      lines.push(`• 🔴 *Congestión alta:* Retraso de +${delay} min hacia El Poblado. Evita subir por la Regional o Av. El Poblado (tacos críticos en La Frontera y Aguacatala). Quédate en el sur: Sabaneta (sector Mayorca / Parque) o Envigado (Viva / Parque) buscando viajes locales.`);
    } else {
      lines.push(`• 🟢 *Tránsito fluido:* Solo +${delay} min de retraso a El Poblado. Al salir del colegio, enrútate directo hacia El Poblado (Milla de Oro / San Fernando Plaza) por Av. Las Vegas o Regional para capturar la salida de ejecutivos y de citas de media mañana.`);
    }
  } else {
    lines.push('• ℹ️ Quédate en el sur: Sabaneta (sector Mayorca/Parque) y Envigado (Viva) son excelentes zonas a las 8:30 AM para evitar los tacos de la Regional.');
  }

  lines.push(qSignal);
  
  // Alerta si hay festivo cercano en el horizonte
  if (upcomingHolidays && upcomingHolidays.length > 0) {
    upcomingHolidays.forEach(h => {
      const [y, m, d] = h.date.split('-');
      lines.push(`• 📅 *Festivo en el horizonte:* "${h.name}" el ${d}/${m}. Prepárate para tarifas altas de retorno de puente.`);
    });
  }

  lines.push(`• ⏱️ *Eficiencia:* Meta ($260K) requerirá aprox *${est.hours} horas* de conducción hoy (rendimiento est: $${est.rate.toLocaleString('es-CO')}/h).`);

  // Recomendación de zonas a evitar
  lines.push('• ⚠️ *Zonas a evitar:* Evita el centro de Medellín si no te lleva un viaje largo bien pagado (retorno lento por taco a las 9 AM). Cuidado con los nuevos puntos de fotomultas en la Regional de Envigado (límite 80 km/h) y Las Palmas (60 km/h).');

  return lines.join('\n');
}

function buildMessage({ weatherMd, pyp, simit, sena, jobs, traffic, todayIso, dayName, holidayName, trmVal, hnPost, didiStrategy }) {
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
          '1. 08:00 AM: Llevar a Dominick a la escuela',
          '2. 08:30 AM: Arranca DiDi + Uber (de corrido · Angelina recoge)',
          '3. SENA / Estudio nocturno post-jornada',
          '4. Empleo semi-auto; postular a mano',
        ];

  const dateHeader = holidayName
    ? `📅 ${dayName} ${todayIso} · 🎉 Festivo: ${holidayName} · auto 5am → sleep`
    : `📅 ${dayName} ${todayIso} · auto 5am → sleep`;

  const trmSection = trmVal
    ? `• 💵 TRM hoy: $${trmVal.toLocaleString('es-CO')} COP`
    : null;

  const readSection = hnPost
    ? `📖 *LEER HOY*\n• [HN] [${hnPost.title}](${hnPost.url})`
    : null;

  const lines = [
    '☕ *LIFEOS DESPERTAR*',
    dateHeader,
    '',
    weatherMd,
    '',
    '🚗 *MOVILIDAD*',
    `• ${pypLine}`,
    '• Moto BXU28C: SOAT/RTM vencidos — *NO circular*',
    `• ${simit}`,
  ];

  if (trmSection) {
    lines.push(trmSection);
  }

  lines.push(
    '',
    traffic,
    '',
    sena,
    '',
    jobs,
    '',
    didiStrategy,
    ''
  );

  if (readSection) {
    lines.push(readSection, '');
  }

  lines.push(
    '🎯 *PLAN*',
    ...agenda,
    '',
    '_Clima Open-Meteo · sin LLM · sin Calendar · PC vuelve a sleep._'
  );

  return lines.join('\n');
}

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

  r = spawnSync('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0'], {
    windowsHide: true,
    timeout: 30_000,
  });
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
  const dayIndex = col.getDay();

  log('Clima Open-Meteo…');
  const weather = await getMedellinWeatherDetailed();
  const weatherMd = formatWeatherMarkdown(weather);

  const pyp = await getPicoYPlaca();
  const simit = getSimitCache();
  const sena = getSenaHint();
  const jobs = getJobsHint();
  const traffic = await getTrafficHint();

  // Nuevos checks dinámicos
  log('Consultando APIs dinámicas externas...');
  const holidayInfo = await getDynamicHoliday(todayIso);
  const holidayName = holidayInfo.today;
  const upcomingHolidays = holidayInfo.upcoming;

  const trmVal = await getTrm();
  const hnPost = await getHnTopPost();
  
  // Estrategia DiDi adaptada al sur, clima y festivos cercanos
  const didiStrategy = await getDidiStrategy(dayIndex, pyp, weather, upcomingHolidays);

  let msg = buildMessage({
    weatherMd,
    pyp,
    simit,
    sena,
    jobs,
    traffic,
    todayIso,
    dayName,
    holidayName,
    trmVal,
    hnPost,
    didiStrategy
  });

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
