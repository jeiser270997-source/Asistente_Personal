/**
 * computrabajo_apply.js
 * Auto-aplicador semi-automático a ofertas de Computrabajo.
 * 
 * Flujo:
 *  1. Lee las ofertas de computrabajo.json
 *  2. Calcula score de match con DeepSeek por cada una
 *  3. Envía a Telegram las candidatas (score > 60) con botones Sí/No
 *  4. Espera N segundos por respuesta (timeout = skip)
 *  5. Si aprobó: Playwright hace login + click en Postularme
 *  6. Registra resultado en data/jobs/aplicaciones.json
 * 
 * Uso: node scripts/computrabajo_apply.js [--auto] [--min-score=65]
 *   --auto: aplica sin esperar aprobación Telegram (modo noche)
 *   --min-score: score mínimo para considerar (default 60)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM }   = require('../lib/llm_service');

const BASE_DIR   = path.resolve(__dirname, '..');
const JOBS_DIR   = path.join(BASE_DIR, 'data', 'jobs');
const APPLY_LOG  = path.join(JOBS_DIR, 'aplicaciones.json');
const CV_BASE    = path.join(JOBS_DIR, 'cv_base.md');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';

const AUTO_MODE = process.argv.includes('--auto');
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const APPROVAL_TIMEOUT_MS = 120_000; // 2 min para responder Telegram

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function loadLog() {
  try { return JSON.parse(fs.readFileSync(APPLY_LOG, 'utf8')); }
  catch { return []; }
}

function saveLog(data) {
  fs.writeFileSync(APPLY_LOG, JSON.stringify(data, null, 2), 'utf8');
}

// ─── TELEGRAM ─────────────────────────────────────────────────
async function sendTelegram(text, keyboard = null) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return null;
  const body = {
    chat_id: TELEGRAM_CHAT,
    text,
    parse_mode: 'HTML',
  };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return data.result?.message_id;
}

// Espera respuesta de callback_query durante N ms
async function waitForApproval(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?timeout=10&allowed_updates=["callback_query"]`);
    const data = await r.json();
    const updates = data.result || [];
    for (const upd of updates) {
      if (upd.callback_query) {
        const cbData = upd.callback_query.data;
        const chatId = upd.callback_query.message?.chat?.id?.toString();
        if (chatId === TELEGRAM_CHAT?.toString()) {
          // Responder al callback para quitar el "loading"
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: upd.callback_query.id, text: cbData === 'si' ? '✅ Aplicando...' : '⏭ Saltando' }),
          });
          return cbData === 'si';
        }
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return null; // timeout
}

// ─── SCORE MATCH ──────────────────────────────────────────────
async function calcularScore(oferta) {
  const cvBase = fs.existsSync(CV_BASE) ? fs.readFileSync(CV_BASE, 'utf8').substring(0, 1000) : '';
  const prompt = `Puntúa del 0-100 qué tan bien encaja este perfil QA junior con la oferta. Responde SOLO JSON:
{"score":N,"recomendar":true/false,"razon":"una frase corta"}

OFERTA: ${oferta.titulo} | ${oferta.empresa} | ${oferta.lugar}
DESCRIPCIÓN: ${(oferta.cuerpo || oferta.titulo || '').substring(0, 800)}
PERFIL: QA Automation Junior, Playwright, JS, CESDE bootcamp (2026), sin exp formal aún, LifeOS project`;

  try {
    const res = await askLLM(prompt, [], [], 0.1);
    const json = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return { score: 55, recomendar: true, razon: 'Score estimado' };
  }
}

// ─── PLAYWRIGHT LOGIN + APPLY ──────────────────────────────────
async function aplicarOferta(browser, ofertaUrl) {
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  const page = await ctx.newPage();
  
  try {
    // Login
    log(`   Login Computrabajo...`);
    await page.goto('https://co.computrabajo.com/candidato/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.fill('input[type="email"], input[name="username"]', CT_EMAIL, { force: true });
    await page.fill('input[type="password"]', CT_PASS, { force: true });
    await page.click('button[type="submit"]', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Ir a la oferta
    log(`   Navegando a oferta: ${ofertaUrl}`);
    await page.goto(ofertaUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Buscar botón Postularme
    const btnTexts = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
    let clicked = false;

    for (const txt of btnTexts) {
      try {
        await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 3000 });
        clicked = true;
        log(`   ✅ Click en "${txt}"`);
        break;
      } catch {}
    }

    if (!clicked) {
      log('   ⚠ Botón "Postularme" no encontrado');
      await ctx.close();
      return { exito: false, razon: 'Botón no encontrado' };
    }

    await page.waitForTimeout(3000);

    // Verificar si se abrió modal de confirmación
    const confirmado = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('postulación') || body.includes('enviada') || 
             body.includes('éxito') || body.includes('aplicación') || 
             body.includes('registrada');
    });

    const screenshot = path.join(JOBS_DIR, `apply_${Date.now()}.png`);
    await page.screenshot({ path: screenshot });

    await ctx.close();
    return { 
      exito: confirmado, 
      razon: confirmado ? 'Postulación enviada' : 'No se pudo confirmar',
      screenshot 
    };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 100) };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  log('═══════════════════════════════════════');
  log(`💼 COMPUTRABAJO AUTO-APPLY (min-score: ${MIN_SCORE}, modo: ${AUTO_MODE ? 'AUTO' : 'SEMI-AUTO'})`);
  log('═══════════════════════════════════════');

  if (!fs.existsSync(path.join(JOBS_DIR, 'computrabajo.json'))) {
    log('❌ No hay datos de Computrabajo. Corre primero: node scripts/computrabajo_scraper.js');
    process.exit(1);
  }

  const { ofertas = [] } = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
  const aplicaciones = loadLog();
  const yaAplicadas = new Set(aplicaciones.map(a => a.oferta_id || a.url));

  // Filtrar las no aplicadas que tienen URL
  const candidatas = ofertas.filter(o => o.url && !yaAplicadas.has(o.id || o.url));
  log(`Ofertas candidatas (no aplicadas): ${candidatas.length}`);

  const browser = await chromium.launch({ headless: true });

  for (const oferta of candidatas.slice(0, 10)) {
    log(`\n📋 Evaluando: "${oferta.titulo}" — ${oferta.empresa}`);

    // Score
    const match = await calcularScore(oferta);
    log(`   Score: ${match.score} | ${match.razon}`);

    if (match.score < MIN_SCORE) {
      log(`   ⏭ Score bajo (${match.score} < ${MIN_SCORE}), saltando`);
      continue;
    }

    let aprobado = AUTO_MODE; // si auto, aplicar directo

    if (!AUTO_MODE && TELEGRAM_TOKEN) {
      // Enviar a Telegram para aprobación
      const msg = `🎯 <b>Oferta QA detectada</b> (score: ${match.score}/100)

<b>${oferta.titulo}</b>
🏢 ${oferta.empresa || 'Empresa'}
📍 ${oferta.lugar || 'Colombia'}

<i>${match.razon}</i>

¿Aplicar automáticamente?`;

      await sendTelegram(msg, [
        [
          { text: '✅ Sí, aplicar', callback_data: 'si' },
          { text: '⏭ Saltar', callback_data: 'no' },
        ]
      ]);

      log(`   📱 Esperando aprobación Telegram (${APPROVAL_TIMEOUT_MS/1000}s)...`);
      const resp = await waitForApproval(APPROVAL_TIMEOUT_MS);

      if (resp === null) {
        log('   ⏱ Timeout — saltando');
        continue;
      }
      aprobado = resp;
    }

    if (!aprobado) {
      log('   ❌ Rechazado por usuario');
      aplicaciones.push({
        oferta_id: oferta.id,
        url: oferta.url,
        titulo: oferta.titulo,
        empresa: oferta.empresa,
        fecha: new Date().toISOString(),
        estado: 'rechazado_usuario',
        score: match.score,
      });
      saveLog(aplicaciones);
      continue;
    }

    // Aplicar
    log(`   🚀 Aplicando a "${oferta.titulo}"...`);
    const resultado = await aplicarOferta(browser, oferta.url);

    const registro = {
      oferta_id: oferta.id,
      url: oferta.url,
      titulo: oferta.titulo,
      empresa: oferta.empresa,
      lugar: oferta.lugar,
      fecha: new Date().toISOString(),
      score: match.score,
      estado: resultado.exito ? 'aplicado' : 'error',
      razon: resultado.razon,
      screenshot: resultado.screenshot,
    };

    aplicaciones.push(registro);
    saveLog(aplicaciones);

    if (resultado.exito) {
      log(`   ✅ APLICADO: ${oferta.titulo} en ${oferta.empresa}`);
      await sendTelegram(`✅ <b>Aplicación enviada</b>\n${oferta.titulo} — ${oferta.empresa}\n<a href="${oferta.url}">Ver oferta</a>`);
    } else {
      log(`   ⚠ Error aplicando: ${resultado.razon}`);
    }

    await new Promise(r => setTimeout(r, 2000)); // pausa entre aplicaciones
  }

  await browser.close();

  // Resumen final
  const nuevasAplicadas = aplicaciones.filter(a => a.estado === 'aplicado');
  log(`\n✅ Sesión completada. Total aplicaciones: ${nuevasAplicadas.length}`);
  if (nuevasAplicadas.length > 0) {
    await sendTelegram(
      `📊 <b>Resumen Auto-Apply</b>\n${nuevasAplicadas.slice(-5).map(a => `✅ ${a.titulo} — ${a.empresa}`).join('\n')}`
    );
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
