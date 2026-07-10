/**
 * analyze_and_apply.js
 * Analiza ofertas existentes de Computrabajo y aplica a las que pasan el score.
 * Procesa lote por lote con delays para evitar detección de bot.
 *
 * Uso: node scripts/jobs/analyze_and_apply.js [--batch=5] [--delay=30]
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const BASE_DIR = path.resolve(__dirname, '..', '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const CT_FILE = path.join(JOBS_DIR, 'computrabajo.json');
const APPLY_LOG = path.join(JOBS_DIR, 'aplicaciones.json');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS = process.env.COMPUTRABAJO_PASS;
const BATCH = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '5');
const DELAY_SEC = parseInt(process.argv.find(a => a.startsWith('--delay='))?.split('=')[1] || '45');
const MIN_SCORE = 55;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch {}
}

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// Login wrapper con retry (de computrabajo_apply.js)
let _loginFailCount = 0;
const MAX_LOGIN_FAILS = 3;

async function loginWithRetry(page, email, pass) {
  for (let attempt = 1; attempt <= MAX_LOGIN_FAILS; attempt++) {
    const ok = await robustLogin(page, email, pass);
    if (ok) { _loginFailCount = 0; return true; }
    _loginFailCount++;
    log(`⚠️ Intento ${attempt}/${MAX_LOGIN_FAILS} de login fallido`);
    if (attempt < MAX_LOGIN_FAILS) await new Promise(r => setTimeout(r, 3000));
  }
  log('❌ 3 intentos de login fallidos. Notificando...');
  try { await sendTelegram('⚠️ Computrabajo: Login fallido tras 3 intentos.'); } catch {}
  throw new Error('Login failed after 3 attempts');
}

async function main() {
  log(`🚀 Analyze & Apply | batch=${BATCH} | delay=${DELAY_SEC}s | min-score=${MIN_SCORE}`);

  // Cargar ofertas existentes
  const ct = loadJSON(CT_FILE);
  const ofertas = Array.isArray(ct) ? ct : (ct.ofertas || ct.data || []);
  log(`📦 ${ofertas.length} ofertas en computrabajo.json`);

  // Cargar aplicaciones previas para no duplicar
  const aplicaciones = loadJSON(APPLY_LOG);
  const aplicadasUrls = new Set(aplicaciones.map(a => a.url).filter(Boolean));

  // Filtrar roles tech/soporte NO analizadas aún
  const pendientes = ofertas.filter(o => {
    if (aplicadasUrls.has(o.url)) return false;
    const t = (o.titulo || '').toLowerCase();
    return t.includes('qa') || t.includes('tester') || t.includes('software') ||
           t.includes('soporte') || t.includes('helpdesk') || t.includes('mesa de ayuda') ||
           t.includes('desarroll') || t.includes('analista') || t.includes('automat') ||
           t.includes('sistemas') || t.includes('it ') || t.includes('tecnolog');
  });

  log(`🎯 ${pendientes.length} ofertas tech/soporte sin analizar`);

  if (pendientes.length === 0) {
    log('✅ No hay ofertas pendientes por analizar');
    return;
  }

  const batch = pendientes.slice(0, BATCH);
  log(`📋 Procesando lote de ${batch.length} ofertas\n`);

  let aprobadas = 0;
  let aplicadas = 0;

  for (let i = 0; i < batch.length; i++) {
    const o = batch[i];
    log(`[${i+1}/${batch.length}] ${o.titulo} — ${o.empresa || '?'}`);

    // 1. Scrape descripción
    let desc = o.descripcion || '';
    if (!desc && o.url) {
      try {
        const browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
        });
        const page = await browser.newPage();
        // Anti-detección
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });
        await page.goto(o.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        desc = (await page.evaluate(() => {
          const d = document.querySelector('[class*="description"], [class*="descripcion"], article, .job-description, .offer-description');
          return d ? d.innerText.substring(0, 2000) : '';
        }).catch(() => '')) || '';
        await browser.close();
      } catch {}
    }

    // 2. Analizar con LLM
    const prompt = `Eres un experto en reclutamiento tech en Colombia. Analiza la compatibilidad.

CANDIDATO - Jeiser Gutierrez:
- QA Automation Junior (CESDE bootcamp 2026, 28 semanas)
- Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL básico, APIs, CI/CD, scrapers, automatización, LLMs
- Experiencia Práctica: LifeOS (asistente personal autónomo con 11 workflows CI/CD, scraping web, integración multi-LLM, SQLite, notificaciones Telegram, Google Calendar API)
- Busca: QA, automatización, soporte técnico, helpdesk, mesa de ayuda — cualquier rol tech entry-level
- Disponible: tiempo completo, Medellín + remoto

IMPORTANTE: Ignora requisitos rígidos de experiencia formal. El proyecto LifeOS demuestra habilidades prácticas reales. Si el rol es entry-level y hay MATCH en skills técnicas (soporte TI, helpdesk, QA), asigna score >= 55.

OFERTA: ${o.titulo} | ${o.empresa || '?'} | ${o.lugar || '?'}
DESCRIPCIÓN: ${desc.substring(0, 1500)}

Responde SOLO JSON:
{ "score": <0-100>, "nivel_requerido": "junior|mid|senior", "recomendar": true/false, "razon_corta": "...", "skills_match": [], "skills_gap": [] }`;

    try {
      const res = await askLLM(prompt, [], 0.1);
      const raw = (res.content || '').replace(/```json|```/g, '').trim();
      const analisis = JSON.parse(raw);
      const { score, recomendar, razon_corta } = analisis;

      log(`   Score: ${score}/100 | ${recomendar ? '✅' : '⏭'} | ${razon_corta || ''}`);

      // Guardar resultado
      aplicaciones.push({
        fecha: new Date().toISOString(),
        titulo: o.titulo,
        empresa: o.empresa,
        url: o.url,
        lugar: o.lugar,
        score,
        recomendar,
        razon_corta,
        estado: 'analizada',
      });

      if (score >= MIN_SCORE && recomendar) {
        aprobadas++;
        log(`   🎯 PASA UMBRAL! (${aprobadas}/${batch.length})`);

        // 3. Aplicar con Playwright
        try {
          const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
          });
          const ctx = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          });
          const page = await ctx.newPage();
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
          });

          // Login
          log(`   🔑 Iniciando sesión...`);
          await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 15000 });
          await loginWithRetry(page, CT_EMAIL, CT_PASS);

          // Ir a la oferta
          await page.goto(o.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

          // Click botón postular
          const btnSelectors = [
            'a:has-text("Aplicar")', 'button:has-text("Aplicar")',
            'button:has-text("Postularme")', 'button:has-text("Postular")',
            'a:has-text("Postularme")', 'a:has-text("Postular")',
            '.js-apply-btn', '[data-qa="applyButton"]', '.b_primary.tiny',
          ];
          let clicked = false;
          for (const sel of btnSelectors) {
            try { await page.click(sel, { timeout: 3000 }); clicked = true; break; } catch {}
          }

          if (clicked) {
            log(`   ✅ Postulado!`);
            aplicaciones[aplicaciones.length - 1].estado = 'aplicada';
            aplicadas++;
            try { await sendTelegram(`✅ Aplicado: ${o.titulo} — ${o.empresa || '?'}`); } catch {}
          } else {
            log(`   ⚠️ No se encontró botón de postular`);
            aplicaciones[aplicaciones.length - 1].estado = 'sin_boton';
          }

          await browser.close();
        } catch (e) {
          log(`   ❌ Error aplicando: ${e.message.substring(0, 80)}`);
          aplicaciones[aplicaciones.length - 1].estado = 'error_aplicar';
        }

        // Delay ENTRE aplicaciones (evitar bot detection)
        log(`   ⏸ Esperando ${DELAY_SEC}s antes de la siguiente...`);
        await new Promise(r => setTimeout(r, DELAY_SEC * 1000));
      }
    } catch (e) {
      log(`   ❌ Error analizando: ${e.message.substring(0, 80)}`);
    }

    // Delay entre análisis
    if (i < batch.length - 1) await new Promise(r => setTimeout(r, 3000));
  }

  // Guardar resultados
  saveJSON(APPLY_LOG, aplicaciones);

  log(`\n✅ Lote completado`);
  log(`   Aprobadas: ${aprobadas}`);
  log(`   Aplicadas: ${aplicadas}`);
}

main().catch(e => {
  log(`❌ FATAL: ${e.message}`);
  process.exit(1);
});
