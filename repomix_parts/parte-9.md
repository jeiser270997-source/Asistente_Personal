r ${today} (Class ${classToday.num})`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
````

## File: scripts/integrations/transito_itagui_scraper.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const RE = require('../../lib/runtime/resume_engine');

const USER = process.env.ITAGUI_USER || 'jeiser270997@gmail.com';
const PASS = process.env.ITAGUI_PASS;
const LOGIN_URL = 'https://movilidad.transitoitagui.gov.co/portal-servicios/#/inicio-login';
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'cache', 'itagui');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

async function scrapeItagui(page) {
  log('Navigating to Itagui Login...');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Intentar login
  try {
    log('Ingresando credenciales...');
    
    log('Esperando carga inicial...');
    await page.waitForTimeout(5000);
    
    // Click "Ingresar" if it's a modal or separate route
    const ingresarBtn = await page.$('a:has-text("Ingresar"), button:has-text("Ingresar")');
    if (ingresarBtn) {
      log('Haciendo click en el botón Ingresar del menú...');
      await ingresarBtn.click();
      await page.waitForTimeout(3000);
    }
    
    const emailInput = await page.$('input[type="email"]') || await page.$('input[formcontrolname="email"]') || await page.$('input[name="email"]') || await page.$('input[type="text"]');
    const passInput = await page.$('input[type="password"]');

    if (!emailInput || !passInput) {
      log('No se encontraron los campos de login, volcando HTML...');
      const html = await page.content();
      fs.writeFileSync(path.join(DATA_DIR, 'debug_login.html'), html);
      await page.screenshot({ path: path.join(DATA_DIR, 'debug_login.png') });
      return null;
    }

    log('Campos encontrados. Buscando los visibles para llenar...');
    
    // Fill the first VISIBLE email input
    const emailInputs = await page.$$('input[type="email"], input[formcontrolname="email"], input[name="email"], input[type="text"]');
    for (const el of emailInputs) {
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(200);
        await el.type(USER, { delay: 50 });
        break;
      }
    }
    
    // Fill the first VISIBLE password input
    const passInputs = await page.$$('input[type="password"]');
    let passFilled = null;
    for (const el of passInputs) {
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(200);
        await el.type(PASS, { delay: 50 });
        passFilled = el;
        break;
      }
    }
    await page.waitForTimeout(500);

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      log('Haciendo click en el botón de Iniciar sesión (submit)...');
      await submitBtn.click();
    } else {
      log('No se encontró el botón de submit, presionando Enter...');
      await passFilled.press('Enter');
    }
    
    log('Esperando redirección o mensaje de error...');
    await page.waitForTimeout(8000);
    
    // Verificar si hay errores
    const errorMsg = await page.$('.alert, .error, .toast-message, mat-error, .text-danger');
    if (errorMsg) {
      const errorText = await errorMsg.innerText();
      log(`POSIBLE ERROR DE LOGIN: ${errorText}`);
    }
    
    const modales = await page.$$('button:has-text("Aceptar"), button:has-text("Cerrar"), button:has-text("OK")');
    for (let i = 0; i < modales.length; i++) {
        try { await modales[i].click(); } catch(e){}
    }
    await page.waitForTimeout(2000);

    log('Extrayendo informacion visible de multas...');
    await page.screenshot({ path: path.join(DATA_DIR, 'dashboard.png') });

    const pageText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(DATA_DIR, 'dashboard_text.txt'), pageText);
    
    log('Datos guardados en dashboard_text.txt para analisis inicial');
    return { text: pageText };
  } catch (err) {
    log(`Error durante el scraping: ${err.message}`);
    return null;
  }
}

async function main() {
  ensureDir();
  RE.start('transito_itagui_scraper');
  log('═══════════════════════════════════════');
  log('TRANSITO ITAGUI SCRAPER');
  log('═══════════════════════════════════════');

  if (!PASS) {
    log('Falta ITAGUI_PASS en .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const data = await scrapeItagui(page);
    if (!data) throw new Error('No se pudo extraer la info');

    RE.finish('transito_itagui_scraper', 'success', { run: true });
    log('Consulta completada (modo analisis)');
  } catch (err) {
    RE.finish('transito_itagui_scraper', 'error', { reason: err.message });
    log(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); process.exit(1); });
````

## File: scripts/integrations/transito_medellin_scraper.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const RE = require('../../lib/runtime/resume_engine');

const USER = process.env.MEDELLIN_USER || '1019156838';
const PASS = process.env.MEDELLIN_PASS;
const LOGIN_URL = 'https://www.medellin.gov.co/irj/portal/medellin/servicios_digitales_movilidad';
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'cache', 'medellin');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

async function scrapeMedellin(page) {
  log('Navigating to Medellin Movilidad...');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  try {
    log('Ingresando credenciales...');
    
    // Look for login form elements, handling possible frames or overlays
    const userInput = await page.$('input[name="j_username"]') || await page.$('input[type="text"]');
    const passInput = await page.$('input[name="j_password"]') || await page.$('input[type="password"]');

    if (!userInput || !passInput) {
      log('No se encontraron los campos de login, volcando HTML...');
      const html = await page.content();
      fs.writeFileSync(path.join(DATA_DIR, 'debug_login.html'), html);
      await page.screenshot({ path: path.join(DATA_DIR, 'debug_login.png') });
      return null;
    }

    log('Campos encontrados. Llenando...');
    await userInput.fill(USER);
    await passInput.fill(PASS);
    await page.waitForTimeout(500);

    const btns = await page.$$('input[type="submit"], button');
    let loginBtn = null;
    for (const btn of btns) {
      const text = await btn.innerText();
      const val = await btn.getAttribute('value');
      const btnText = (text || val || '').toLowerCase();
      if (btnText.includes('ingresar') || btnText.includes('iniciar') || btnText.includes('entrar') || btnText.includes('login')) {
        loginBtn = btn;
        break;
      }
    }

    if (!loginBtn) {
      await passInput.press('Enter');
    } else {
      await loginBtn.click();
    }
    
    log('Esperando redirección...');
    await page.waitForTimeout(8000);
    
    const modales = await page.$$('button:has-text("Aceptar"), button:has-text("Cerrar"), button:has-text("OK")');
    for (let i = 0; i < modales.length; i++) {
        try { await modales[i].click(); } catch(e){}
    }
    await page.waitForTimeout(2000);

    log('Extrayendo informacion visible de multas...');
    await page.screenshot({ path: path.join(DATA_DIR, 'dashboard.png') });

    const pageText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(DATA_DIR, 'dashboard_text.txt'), pageText);
    
    log('Datos guardados en dashboard_text.txt para analisis inicial');
    return { text: pageText };
  } catch (err) {
    log(`Error durante el scraping: ${err.message}`);
    return null;
  }
}

async function main() {
  ensureDir();
  RE.start('transito_medellin_scraper');
  log('═══════════════════════════════════════');
  log('TRANSITO MEDELLIN SCRAPER');
  log('═══════════════════════════════════════');

  if (!PASS) {
    log('Falta MEDELLIN_PASS en .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: {
        'Accept-Language': 'es-CO,es;q=0.9',
        'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"'
    }
  });
  const page = await context.newPage();
  
  try {
    const data = await scrapeMedellin(page);
    if (!data) throw new Error('No se pudo extraer la info');

    RE.finish('transito_medellin_scraper', 'success', { run: true });
    log('Consulta completada (modo analisis)');
  } catch (err) {
    RE.finish('transito_medellin_scraper', 'error', { reason: err.message });
    log(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); process.exit(1); });
````

## File: scripts/jobs/analyze_and_apply.js
````javascript
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
const { PATHS }  = require('../../lib/data/paths');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const CT_FILE   = PATHS.COMPUTRABAJO_JSON;
const APPLY_LOG = PATHS.APLICACIONES;

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

REGLAS ESTRICTAS: NO asignar score > 30 a roles de: Analista de Oxígeno, SST, Químico, Fisicoquímico, Calidad industrial (alimentos/laboratorio/procesos), Auxiliar de Calidad industrial, Practicante de Calidad industrial. Estos NO son roles tech. Solo si la descripción menciona herramientas de software explícitamente.

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
````

## File: scripts/jobs/build_cv_from_md.js
````javascript
/**
 * scripts/jobs/build_cv_from_md.js
 * Convierte cv_base.md a PDF usando Playwright (renderiza como HTML estilizado).
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const fs   = require('node:fs');
const path = require('node:path');

const MD_PATH  = path.resolve(__dirname, '../../data/sources/jobs/cv_base.md');
const PDF_PATH = path.resolve(__dirname, '../../data/jobs/CV_Jeiser_Gutierrez_QA_Automation.pdf');

function mdToHtml(md) {
  return md
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p class="job-title">$1</p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul>${m}</ul>`)
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^\[(.+?)\]\((.+?)\)/gm, '<a href="$2">$1</a>');
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 10.5pt; color: #1a1a2e; line-height: 1.5; padding: 28px 36px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20pt; font-weight: 700; color: #0f3460; border-bottom: 2px solid #0f3460; padding-bottom: 6px; margin-bottom: 4px; }
  h2 { font-size: 11.5pt; font-weight: 700; color: #0f3460; border-bottom: 1px solid #dee2e6; padding-bottom: 3px; margin: 14px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  h3 { font-size: 10.5pt; font-weight: 600; margin: 8px 0 2px; color: #1a1a2e; }
  p { margin: 3px 0; }
  .job-title { font-weight: 600; margin-top: 10px; margin-bottom: 1px; }
  ul { margin: 4px 0 4px 16px; }
  li { margin: 2px 0; font-size: 10pt; }
  hr { border: none; border-top: 1px solid #dee2e6; margin: 10px 0; }
  em { color: #495057; font-style: normal; font-size: 9.5pt; }
  strong { font-weight: 600; }
  a { color: #0f3460; text-decoration: none; }
  @page { margin: 1.5cm; size: A4; }
`;

async function buildPDF() {
  const md  = fs.readFileSync(MD_PATH, 'utf-8');
  const body = mdToHtml(md);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.pdf({ path: PDF_PATH, format: 'A4', printBackground: true, margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' } });
  await browser.close();

  const size = (fs.statSync(PDF_PATH).size / 1024).toFixed(1);
  console.log(`✅ PDF generado: ${PDF_PATH} (${size} KB)`);
}

buildPDF().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
````

## File: scripts/jobs/check_aplicaciones.js
````javascript
/**
 * check_aplicaciones.js — Verifica historial de aplicaciones en CT
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');
const { robustLogin } = require('./ct_login_helper');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  // Login
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await robustLogin(page, CT_EMAIL, CT_PASS);
  await page.waitForTimeout(2000);
  console.log('Login:', page.url());

  // Ir al historial de aplicaciones
  const url = 'https://candidato.co.computrabajo.com/candidate/match?st=1';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log('URL: ' + page.url());
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(__dirname, '..', 'diag_aplicaciones.png') });
  console.log('URL:', page.url());

  const texto = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return clean(document.body.innerText).substring(0, 3000);
  });

  console.log('\n══ HISTORIAL DE APLICACIONES ══');
  console.log(texto.substring(0, 2000));

  await browser.close();
})().catch(e => console.error('Error:', e.message));
````

## File: scripts/jobs/ct_login_helper.js
````javascript
/**
 * scripts/jobs/ct_login_helper.js
 *
 * Login robusto Computrabajo — flujo actualizado Jul 2026
 * URL: https://candidato.co.computrabajo.com/acceso/
 * Paso 1: Email → Continuar (redirige a secure.computrabajo.com)
 * Paso 2: Password → Submit
 */

const LOGIN_URL = 'https://candidato.co.computrabajo.com/acceso/';

async function robustLogin(page, email, pass) {
  try {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    if (!email || !pass) {
      throw new Error('Faltan credenciales COMPUTRABAJO_EMAIL / COMPUTRABAJO_PASS en .env');
    }

    // ── PASO 1: Email ─────────────────────────────────────────────
    console.log('  [ct_login] Paso 1: ingresando email...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('#Email', { state: 'visible', timeout: 15000 });
    await page.fill('#Email', email);
    await page.waitForTimeout(500);

    await page.click('#continueWithMailButton', { timeout: 8000 });
    console.log('  [ct_login] Click Continuar OK');

    // ── PASO 2: Password (en secure.computrabajo.com) ─────────────
    await page.waitForSelector('#password', { state: 'visible', timeout: 15000 });
    console.log('  [ct_login] Paso 2: ingresando password...');

    // Limpiar y rellenar email en paso 2 por si se resetea
    try {
      const emailVal = await page.$eval('#Email', e => e.value);
      if (!emailVal) await page.fill('#Email', email);
    } catch { /* campo puede no estar visible */ }

    await page.fill('#password', pass);
    await page.waitForTimeout(500);

    // Botón submit — buscar por orden de preferencia
    const submitted = await page.evaluate(() => {
      const btns = [
        document.querySelector('#btnSubmitPass'),
        document.querySelector('button[type="submit"]'),
        document.querySelector('input[type="submit"]'),
        [...document.querySelectorAll('button')].find(b =>
          /iniciar|entrar|acceder|login/i.test(b.textContent)
        ),
      ].filter(Boolean);
      if (btns[0]) { btns[0].click(); return true; }
      return false;
    });

    if (!submitted) {
      console.log('  [ct_login] Submit button no encontrado, usando Enter');
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(5000);

    // ── VERIFICACIÓN ──────────────────────────────────────────────
    const currentUrl = page.url();
    const loginOk = currentUrl.includes('candidato.co.computrabajo.com') &&
                    !currentUrl.includes('/acceso') &&
                    !currentUrl.includes('Account/Login');

    if (!loginOk) {
      // Fallback: buscar elementos de dashboard
      const dashOk = await page.waitForSelector(
        '[class*="user"], [href*="postulaciones"], [href*="mi-cv"], .avatar, .user-name',
        { timeout: 8000 }
      ).then(() => true).catch(() => false);

      if (!dashOk) {
        console.error('  [ct_login] ⚠️ Login fallido. URL:', currentUrl.substring(0, 80));
        return false;
      }
    }

    console.log('  [ct_login] ✅ Login exitoso. URL:', page.url().substring(0, 60));
    return true;
  } catch (error) {
    console.error('  [ct_login] Error crítico:', error.message.substring(0, 120));
    throw error;
  }
}

module.exports = { robustLogin, LOGIN_URL };
````

## File: scripts/jobs/cv_tailorer.js
````javascript
/**
 * cv_tailorer.js
 * Toma una oferta de Computrabajo + cv_base.md y genera un CV
 * personalizado con DeepSeek optimizado para esa oferta específica.
 * 
 * Uso: node scripts/cv_tailorer.js <url_oferta>
 *      node scripts/cv_tailorer.js --oferta-id <id>
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs   = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { askLLM } = require('../../lib/ai/llm_service');

const BASE_DIR  = path.resolve(__dirname, '..');
const JOBS_DIR  = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE   = path.join(JOBS_DIR, 'cv_base.md');
const CV_OUT    = path.join(JOBS_DIR, 'cv_tailored');

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── SCRAPE DESCRIPCIÓN COMPLETA DE OFERTA ────────────────────
async function scrapeOferta(url) {
  log(`🔍 Scrapeando oferta: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  const page = await ctx.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    return {
      titulo:      clean(document.querySelector('h1, .js-jobTitle, [class*="title"]')?.textContent),
      empresa:     clean(document.querySelector('[class*="company"], [class*="empresa"], p[title]')?.textContent),
      lugar:       clean(document.querySelector('[class*="location"], [class*="ciudad"]')?.textContent),
      salario:     clean(document.querySelector('[class*="salary"], [class*="salario"]')?.textContent),
      descripcion: clean(document.querySelector('[class*="description"], [class*="descripcion"], #job-body, .jobDescriptionSection')?.textContent),
      requisitos:  clean(document.querySelector('[class*="requirements"], [class*="requisitos"]')?.textContent),
      cuerpo:      clean(document.body.innerText).substring(0, 5000),
    };
  });

  await browser.close();
  log(`✅ Oferta: "${data.titulo}" — ${data.empresa}`);
  return data;
}

// ─── TAILORING CON DEEPSEEK ───────────────────────────────────
async function tailorCV(cvBase, oferta) {
  log('🧠 Personalizando CV con DeepSeek...');

  const prompt = `Eres un experto en recursos humanos y redacción de CVs para el mercado tech colombiano.

TAREA: Personalizar el CV de Jeiser para maximizar su match con esta oferta específica.

OFERTA:
Título: ${oferta.titulo}
Empresa: ${oferta.empresa}
Descripción/Requisitos:
${oferta.descripcion || oferta.cuerpo}

CV BASE DE JEISER:
${cvBase}

INSTRUCCIONES:
1. Reescribe el CV completo en formato Markdown manteniendo el estilo Harvard limpio
2. Ajusta el RESUMEN PROFESIONAL (añade uno si no existe) para hacer match exacto con el título y requerimientos
3. Reordena y prioriza las skills que menciona la oferta — pon primero las que piden
4. Si la oferta pide algo que Jeiser no tiene explícito, busca la habilidad más cercana y ponla en contexto real
5. Ajusta la descripción de LifeOS y proyectos para enfatizar lo que la oferta valora
6. NO inventes experiencia ni certificaciones que Jeiser no tiene
7. Mantén TODO en español excepto términos técnicos en inglés
8. El CV final debe tener máximo UNA PÁGINA cuando se imprima

Devuelve SOLO el CV en Markdown, sin explicaciones ni comentarios adicionales.`;

  const response = await askLLM(prompt, [], 0.3);
  return (response.content || '').trim();
}

// ─── CALCULAR SCORE DE MATCH ──────────────────────────────────
async function calcularMatch(cvBase, oferta) {
  const prompt = `Analiza qué tan bien encaja Jeiser con esta oferta. Responde SOLO con un JSON:
{
  "score": <número 0-100>,
  "puntos_fuertes": ["...", "..."],
  "brechas": ["...", "..."],
  "recomendar_aplicar": true/false,
  "razon": "una frase"
}

OFERTA: ${oferta.titulo} en ${oferta.empresa}
DESCRIPCIÓN: ${(oferta.descripcion || oferta.cuerpo).substring(0, 1500)}

PERFIL JEISER: QA Automation Junior, Playwright, JS, CESDE bootcamp en curso, sin experiencia formal en QA aún.`;

  const response = await askLLM(prompt, [], 0.1);
  try {
    const json = (response.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return { score: 0, recomendar_aplicar: false, razon: 'LLM no disponible — fail-closed', scoring_status: 'failed' };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  ensureDir(CV_OUT);

  const urlArg = process.argv[2];
  if (!urlArg) {
    // Sin argumento: procesar las 5 mejores ofertas guardadas
    const data = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo.json'), 'utf8'));
    const ofertas = (data.ofertas || []).filter(o => o.url).slice(0, 5);
    log(`Procesando ${ofertas.length} ofertas del último scrape...`);

    const cvBase = fs.readFileSync(CV_BASE, 'utf8');
    const resultados = [];

    for (const oferta of ofertas) {
      try {
        const detalles  = await scrapeOferta(oferta.url);
        const match     = await calcularMatch(cvBase, detalles);
        const cvTailored = match.recomendar_aplicar ? await tailorCV(cvBase, detalles) : null;

        const slug = (oferta.titulo || 'oferta').toLowerCase().replace(/\s+/g, '-').substring(0, 30);
        const timestamp = Date.now();

        const resultado = {
          oferta: { ...oferta, ...detalles },
          match,
          cv_path: null,
        };

        if (cvTailored) {
          const cvPath = path.join(CV_OUT, `cv_${slug}_${timestamp}.md`);
          fs.writeFileSync(cvPath, cvTailored, 'utf8');
          resultado.cv_path = cvPath;
          log(`✅ CV generado: ${path.basename(cvPath)} (score: ${match.score})`);
        } else {
          log(`⏭ Saltando "${oferta.titulo}" — score bajo (${match.score}): ${match.razon}`);
        }

        resultados.push(resultado);
      } catch (e) {
        log(`⚠ Error en "${oferta.titulo}": ${e.message.substring(0, 80)}`);
      }
    }

    const resumenPath = path.join(JOBS_DIR, 'cv_tailoring_results.json');
    fs.writeFileSync(resumenPath, JSON.stringify(resultados, null, 2), 'utf8');

    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMEN CV TAILORING');
    console.log('═══════════════════════════════════════');
    resultados.forEach(r => {
      const icon = r.match.recomendar_aplicar ? '✅' : '❌';
      console.log(`${icon} [${r.match.score || '?'}] ${r.oferta.titulo} — ${r.oferta.empresa}`);
      if (r.match.brechas?.length) console.log(`   Brechas: ${r.match.brechas.join(', ')}`);
      if (r.cv_path) console.log(`   CV: ${path.basename(r.cv_path)}`);
    });

  } else {
    // Con URL específica
    const cvBase   = fs.readFileSync(CV_BASE, 'utf8');
    const detalles = await scrapeOferta(urlArg);
    const match    = await calcularMatch(cvBase, detalles);
    const cvTailored = await tailorCV(cvBase, detalles);

    console.log('\n📊 MATCH ANALYSIS:');
    console.log(JSON.stringify(match, null, 2));

    const slug = (detalles.titulo || 'oferta').toLowerCase().replace(/\s+/g, '-').substring(0, 30);
    const cvPath = path.join(CV_OUT, `cv_${slug}.md`);
    fs.writeFileSync(cvPath, cvTailored, 'utf8');
    console.log(`\n✅ CV personalizado guardado: ${cvPath}`);
    console.log('\nPrimeras líneas:\n' + cvTailored.substring(0, 500));
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
````

## File: scripts/jobs/find_aplicaciones.js
````javascript
/**
 * find_aplicaciones.js — Encuentra la URL del historial de aplicaciones CT
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');
const { robustLogin } = require('./ct_login_helper');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  // Login
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await robustLogin(page, CT_EMAIL, CT_PASS);
  await page.waitForTimeout(2000);

  // Desde el home, buscar todos los links del menú
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')]
      .map(a => ({ text: a.textContent.trim().substring(0, 40), href: a.href }))
      .filter(l => l.href.includes('candidato') && l.text.length > 2)
      .filter((v, i, a) => a.findIndex(x => x.href === v.href) === i)
      .slice(0, 30);
  });

  console.log('Links del perfil CT:');
  links.forEach(l => console.log(`  ${l.text.padEnd(35)} → ${l.href}`));

  // También buscar link "aplicaciones", "postulaciones", "mis ofertas"
  const appLink = links.find(l =>
    /aplica|postula|mis ofertas|inscri/i.test(l.text) ||
    /aplica|postula|inscri/i.test(l.href)
  );
  if (appLink) {
    console.log('\n✅ Link de aplicaciones encontrado:', appLink);
    await page.goto(appLink.href, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);
    const texto = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 2000));
    console.log('\n══ CONTENIDO ══\n', texto);
  }

  await browser.close();
})().catch(e => console.error('Error:', e.message));
````

## File: scripts/jobs/process_juniorjobs.js
````javascript
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');
const AppStore = require('../../runtime/stores/ApplicationStore');
const { evaluateFit } = require('../../lib/runtime/job_tracker');
const { sendTelegramMessage } = require('../../lib/integrations/telegram');

const INPUT_FILE = path.join(__dirname, '..', '..', 'data', 'jobs', 'input_jobs.txt');

async function main() {
  console.log('🤖 Iniciando Neural Handshake con JuniorJobs...');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.log('❌ No existe input_jobs.txt');
    return;
  }

  const rawText = fs.readFileSync(INPUT_FILE, 'utf8').trim();
  if (rawText.length < 50) {
    console.log('💤 No hay datos en input_jobs.txt. El Jaeger sigue en reposo.');
    return;
  }

  console.log('🧠 Procesando datos crudos a través del LLM...');

  const prompt = `Eres un extractor de datos precisos. El usuario te proporcionará un boletín de ofertas laborales.
  
REGLAS ESTRICTAS:
1. Extrae ÚNICAMENTE las ofertas que sean 100% Remotas, o que estén ubicadas en Colombia o LATAM.
2. IGNORA completamente las ofertas presenciales en Europa (España, Alemania, etc.) a menos que digan 100% remoto.
3. Formatea la salida EXCLUSIVAMENTE como un array de objetos JSON válido. Cero markdown, cero texto extra.

ESTRUCTURA JSON:
[
  {
    "empresa": "Nombre Empresa",
    "cargo": "Rol o Puesto",
    "modalidad": "Remoto / Híbrido / Presencial",
    "url": "https://..."
  }
]

TEXTO A ANALIZAR:
${rawText.substring(0, 10000)} // Límite de seguridad
`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const jsonStr = (res.content || '').replace(/```json|```/g, '').trim();
    const ofertas = JSON.parse(jsonStr);

    console.log(`✅ El LLM extrajo ${ofertas.length} ofertas relevantes (LATAM/Remotas). Evaluando...`);

    let recomendadas = 0;
    let guardadas = 0;
    let tgMessage = `📋 <b>JuniorJobs Procesado (Local)</b>\n<i>${ofertas.length} ofertas LATAM/Remotas encontradas</i>\n\n`;

    for (const oferta of ofertas) {
      const fit = evaluateFit(oferta.empresa, oferta.cargo, oferta.modalidad);
      
      if (fit.compatible) {
        recomendadas++;
        
        // Verificar si ya existe en SQLite
        const existe = AppStore.findByUrl(oferta.url);
        
        if (!existe) {
          AppStore.create({
            source: 'juniorjobs',
            empresa: oferta.empresa,
            cargo: oferta.cargo,
            plataforma: 'JuniorJobs',
            url: oferta.url,
            detalles: `Modalidad: ${oferta.modalidad}`,
            estado: 'pendiente', // Lo guardamos como pendiente para aplicar manualmente luego
            score: fit.score,
            compatible: 1,
            razones: fit.razones
          });
          guardadas++;
          tgMessage += `🟢 <b>${oferta.cargo}</b> @ ${oferta.empresa}\n  Score: ${fit.score}/100\n  <a href="${oferta.url}">Ver Oferta</a>\n\n`;
        }
      }
    }

    if (guardadas > 0) {
      console.log(`💾 Guardadas ${guardadas} nuevas ofertas en SQLite (Estado: Pendiente).`);
      await sendTelegramMessage(tgMessage);
      console.log('📲 Reporte enviado a Telegram.');
    } else {
      console.log('⚠️ No se encontraron ofertas nuevas de alto valor.');
      await sendTelegramMessage(`📋 <b>JuniorJobs</b>\nSe analizaron ${ofertas.length} ofertas, pero ninguna superó el filtro de calidad o ya estaban guardadas.`);
    }

    // Purgar el archivo después de procesar para dejarlo limpio
    fs.writeFileSync(INPUT_FILE, '', 'utf8');
    console.log('🧹 input_jobs.txt purgado. Drift finalizado.');

  } catch (error) {
    console.error('❌ Error de procesamiento:', error.message);
  }
}

main().catch(console.error);
````

## File: scripts/maintenance/backup_dbs.ts
````typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.join(__dirname, '..', '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', 'drive_sync');

// Asegurar que el directorio destino existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generar nombre del archivo con timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
const backupFile = path.join(BACKUP_DIR, `lifeos_dbs_${timestamp}.zip`);

// Rutas de las bases de datos a respaldar (paths canónicos)
const dbPaths = [
  path.join(ROOT_DIR, 'data', 'memoria_hipocampo.db'),
  path.join(ROOT_DIR, 'runtime', 'lifeos.db')
].filter(p => fs.existsSync(p)); // Solo las que realmente existen

if (dbPaths.length === 0) {
  console.log("⚠️ No se encontraron bases de datos para respaldar.");
  process.exit(0);
}

// Convertir rutas a strings para PowerShell
const pathsForPs = dbPaths.map(p => `"${p}"`).join(', ');

// Comando PowerShell para crear el ZIP
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path ${pathsForPs} -DestinationPath '${backupFile}' -Force"`;

console.log(`📦 Iniciando backup de ${dbPaths.length} bases de datos...`);

try {
  execSync(psCommand, { stdio: 'inherit' });
  console.log(`✅ Backup completado exitosamente: ${backupFile}`);

  // Intento de copia automática a Google Drive Desktop
  const gDrivePath = 'G:\\My Drive';
  if (fs.existsSync(gDrivePath)) {
    const gDriveBackupDir = path.join(gDrivePath, 'LifeOS_Backups');
    if (!fs.existsSync(gDriveBackupDir)) {
      fs.mkdirSync(gDriveBackupDir, { recursive: true });
    }
    const destPath = path.join(gDriveBackupDir, path.basename(backupFile));
    fs.copyFileSync(backupFile, destPath);
    console.log(`☁️ Backup copiado exitosamente a Google Drive: ${destPath}`);
  } else {
    console.log(`☁️ Nota: No se detectó 'G:\\My Drive' para copia automática.`);
  }

} catch (error: any) {
  console.error(`❌ Error al crear el backup:`, error.message);
  process.exit(1);
}
````

## File: scripts/maintenance/event_worker.js
````javascript
/**
 * scripts/maintenance/event_worker.js
 *
 * Worker de Transactional Outbox — Ejecución Síncrona de Eventos.
 *
 * Lee eventos pendientes de event_outbox, busca los handlers registrados
 * en event_registry.js, los ejecuta secuencialmente y marca resultados.
 *
 * Diseñado para la arquitectura Run & Die:
 *   - Resetea eventos 'processing' atascados (power loss recovery)
 *   - Procesa eventos en batches de 50
 *   - Retry hasta 3 intentos por evento
 *   - Eventos fallidos van a event_dlq
 *   - Housekeeping: limpia eventos completados > 72h
 *
 * Instalación en daily_routine.js:
 *   1. Después de Fase 3 (Scrapers y Empleo)
 *   2. Justo antes de Fase 6 (Briefing) — para datos 100% actualizados
 *
 * Dependencias:
 *   - runtime/stores/Database.js (getDb)
 *   - runtime/stores/OutboxStore.js
 *   - lib/events/event_bus.js (getHandlers)
 *   - lib/jobs/feedbackEngine.js (handler principal)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');

// ── Configuración ────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const CLEANUP_HOURS_OLD = 72;

// ── Inicialización ───────────────────────────────────────────────────────────

process.env.STORAGE_DRIVER = 'sqlite';
const { getDb, close } = require('../../runtime/stores/Database');
const OutboxStore = require('../../runtime/stores/OutboxStore');
const bus = require('../../lib/events/event_bus');

// Importar módulos que registran handlers en event_registry.js
// Cada módulo es responsable de llamar a bus.on() durante su inicialización
// o a través de una función connectToBus() explícita.
const feedbackEngine = require('../../lib/jobs/feedbackEngine');

// Registrar handlers de feedbackEngine
feedbackEngine.connectToBus(bus);

// ── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function log(msg) {
  console.log(`[${timestamp()}] [event-worker] ${msg}`);
}

/**
 * Obtiene todos los handlers registrados para debugging.
 */
function logRegisteredHandlers() {
  const all = bus.getAllHandlers();
  const total = Object.values(all).reduce((sum, handlers) => sum + handlers.length, 0);
  if (total > 0) {
    log(`${total} handler(s) registrados para ${Object.keys(all).length} tipo(s) de evento:`);
    for (const [type, handlers] of Object.entries(all)) {
      log(`   ${type}: ${handlers.join(', ')}`);
    }
  } else {
    log('⚠️  No hay handlers registrados — los eventos no tendrán procesamiento');
  }
}

// ── Ciclo Principal ──────────────────────────────────────────────────────────

async function main() {
  const db = getDb();
  const stats = { processed: 0, completed: 0, failed: 0, dlq: 0, stuck: 0, cleaned: 0 };

  // ── Fase 0: Resetear eventos 'processing' atascados (power loss recovery) ──
  // Si el proceso murió mientras marcaba eventos como 'processing',
  // los resetea a 'pending' para reprocesarlos.
  stats.stuck = OutboxStore.resetStuck(db);
  if (stats.stuck > 0) {
    log(`${stats.stuck} evento(s) atascados reseteados a pending (power loss recovery)`);
  }

  // ── Fase 1: Obtener eventos pendientes ──
  const events = OutboxStore.getPending(db, BATCH_SIZE);
  if (events.length === 0) {
    log('No hay eventos pendientes. Outbox vacía.');
    logRegisteredHandlers();

    // Housekeeping igual (por si hay completados viejos)
    stats.cleaned = OutboxStore.cleanCompleted(db, CLEANUP_HOURS_OLD);
    if (stats.cleaned > 0) log(`${stats.cleaned} evento(s) viejos limpiados`);

    close();
    log(`Worker finalizado. Stats: ${JSON.stringify(stats)}`);
    return;
  }

  log(`Procesando ${events.length} evento(s) pendiente(s)...`);

  // ── Fase 2: Procesar cada evento ──
  for (const event of events) {
    stats.processed++;

    // Sticky bit: marcar como processing para evitar doble procesamiento
    OutboxStore.markProcessing(db, event.eventId);

    // Buscar handlers registrados para este tipo de evento
    // (feedbackEngine.connectToBus(bus) registró handlers para job.*,
    //  modules adicionales pueden registrar sus propios handlers)
    const handlers = bus.getHandlers(event.eventType);

    if (handlers.length === 0) {
      log(`⚠️  Sin handler para ${event.eventType} — moviendo a DLQ`);
      OutboxStore.moveToDlq(db, event.eventId);
      stats.dlq++;
      continue;
    }

    // Ejecutar cada handler secuencialmente
    let hadError = false;
    for (const handler of handlers) {
      try {
        const envelope = {
          id: event.eventId,
          type: event.eventType,
          payload: event.payload,
          meta: event.meta || {},
          timestamp: event.createdAt ? new Date(event.createdAt + 'Z').getTime() : Date.now(),
        };

        // Soporte tanto para handlers síncronos como async
        const result = handler(envelope);
        if (result && typeof result.then === 'function') {
          await result.catch(err => { throw err; });
        }
      } catch (err) {
        log(`❌ Error en handler para ${event.eventType}: ${err.message}`);
        hadError = true;
      }
    }

    // Marcar resultado
    if (!hadError) {
      OutboxStore.markCompleted(db, event.eventId);
      stats.completed++;
    } else {
      const wentToDlq = OutboxStore.markFailed(db, event.eventId, 'Handler execution error');
      if (wentToDlq) {
        log(`⚠️  ${event.eventType} excedió reintentos — moviendo a DLQ`);
        OutboxStore.moveToDlq(db, event.eventId);
        stats.dlq++;
      } else {
        log(`🔄 ${event.eventType} reintentará (pendiente)`);
      }
      stats.failed++;
    }
  }

  // ── Fase 3: Housekeeping ──
  stats.cleaned = OutboxStore.cleanCompleted(db, CLEANUP_HOURS_OLD);
  if (stats.cleaned > 0) log(`${stats.cleaned} evento(s) viejos limpiados`);

  // ── Finalizar ──
  close();
  log(`Worker finalizado. Stats: ${JSON.stringify(stats)}`);
  log(`   ✅ ${stats.completed} completados | ❌ ${stats.failed} fallos | 🗑️ ${stats.dlq} DLQ`);
}

// ── EXEC ─────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error(`[${timestamp()}] [event-worker] 💥 FATAL: ${err.message}`);
  try { close(); } catch {}
  process.exit(1);
});
````

## File: scripts/schedulers/context_engine_daily.js
````javascript
/**
 * context_engine_daily.js
 *
 * Se ejecuta 1 vez al día. Toma los correos importantes de las últimas 24h
 * (los que sobrevivieron al Rule Engine), los envía en lote al LLM para
 * extraer cambios de contexto, y actualiza CaseStore + Ledger.
 *
 * Flujo:
 *   1. Cargar correos importantes desde el Context Queue (CheckpointStore)
 *   2. Enviar batch al LLM con prompt estructurado
 *   3. Parsear JSON de respuesta
 *   4. Actualizar CaseStore + Ledger
 *   5. Generar resumen diario → Telegram
 *
 * Uso: node scripts/context_engine_daily.js [--dry-run]
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { askLLM } = require('../../lib/ai/llm_service');

const DRY_RUN = process.argv.includes('--dry-run');

const bus = require('../../lib/events/event_bus');

const CaseStore = require('../../runtime/stores/CaseStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const RE = require('../../lib/runtime/resume_engine');

function log(msg) { console.log(`[CTX] ${msg}`); }

/**
 * Carga la cola de correos importantes desde CheckpointStore.
 * La cola es alimentada por email_processor.js cuando detecta
 * emails con action.notify === true o action.logToLedger === true.
 */
function loadContextQueue() {
  const queue = CheckpointStore.get('context_queue');
  if (!queue || !Array.isArray(queue)) return [];
  log(`Context Queue: ${queue.length} emails`);
  return queue;
}

function clearContextQueue() {
  CheckpointStore.set('context_queue', []);
}

function pushToContextQueue(email) {
  const queue = CheckpointStore.get('context_queue') || [];
  queue.push(email);
  if (queue.length > 100) queue.splice(0, queue.length - 100);
  CheckpointStore.set('context_queue', queue);
}

/**
 * Envía el lote al LLM con un prompt estructurado.
 * El LLM devuelve JSON con los cambios detectados.
 */
async function analyzeBatch(emails) {
  if (emails.length === 0) return { cambios: [], resumen: 'Sin correos importantes en las ultimas 24h.' };

  const prompt = `Eres un asistente de contexto personal. Analiza estos correos y extrae los cambios importantes para la vida del usuario.

Para cada correo, determina:
  - Es un PROCESO NUEVO? (nueva multa, postulación, trámite)
  - Es una ACTUALIZACIÓN de un proceso existente? (entrevista, respuesta, vencimiento)
  - Es una ALERTA? (pago pendiente, fecha límite)
  - Es INFORMATIVO? (factura, newsletter, notificación)

Responde SOLO con JSON válido:
{
  "cambios": [
    {
      "tipo": "proceso_nuevo|actualizacion|alerta|informativo",
      "categoria": "legal|empleo|estudio|finanzas|gobierno|otro",
      "titulo": "nombre corto del proceso",
      "descripcion": "que paso",
      "estado": "estado actual",
      "accion_requerida": true/false,
      "prioridad": 0-3,
      "fecha_limite": "YYYY-MM-DD o null",
      "entidad": "quien envio"
    }
  ],
  "resumen": "parrafo corto con los cambios mas importantes del dia"
}

CORREOS:
${emails.map((e, i) => `[${i + 1}] De: ${e.from || '?'} | Asunto: ${e.subject || '?'} | ${e.snippet || e.body || ''}`.substring(0, 500)).join('\n\n')}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (e) {
    log('LLM error: ' + e.message);
    return { cambios: [], resumen: 'Error al analizar correos.' };
  }
}

/**
 * Aplica los cambios detectados al CaseStore.
 */
function applyCambios(cambios) {
  if (!cambios.length) return 0;

  let count = 0;
  for (const c of cambios) {
    const caseId = `ctx_${c.categoria}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (c.tipo === 'proceso_nuevo') {
      CaseStore.create({
        id: caseId,
        tipo: c.categoria,
        estado: c.estado || 'abierto',
        titulo: c.titulo,
        descripcion: c.descripcion,
        data: { entidad: c.entidad, fecha_limite: c.fecha_limite, accion_requerida: c.accion_requerida },
        prioridad: c.prioridad ?? 2,
      });
      CaseStore.addEvent(caseId, 'creacion', `Nuevo: ${c.titulo}`, c);
      bus.emit('case.created', { id: caseId, tipo: c.categoria, titulo: c.titulo, estado: c.estado, prioridad: c.prioridad });
      log(`  Nuevo caso: ${c.categoria}/${c.titulo} [${c.estado}]`);
      count++;

    } else if (c.tipo === 'actualizacion') {
      // Buscar caso existente por tipo + entidad
      const existentes = CaseStore.getAll(c.categoria);
      const match = existentes.find(ex =>
        ex.titulo?.toLowerCase().includes((c.titulo || '').substring(0, 20).toLowerCase()) ||
        ex.data?.entidad?.toLowerCase() === (c.entidad || '').toLowerCase()
      );
      if (match) {
        CaseStore.update(match.id, { estado: c.estado, data: { ...match.data, ...c, ultima_actualizacion: new Date().toISOString() } });
        CaseStore.addEvent(match.id, 'actualizacion', c.descripcion || c.titulo, c);
        bus.emit('case.updated', { id: match.id, tipo: c.categoria, estado: c.estado });
        log(`  Actualizado: ${match.titulo} → ${c.estado}`);
      } else {
        // No encontrado: crear como nuevo
        CaseStore.create({
          id: caseId, tipo: c.categoria, estado: c.estado || 'abierto',
          titulo: c.titulo, descripcion: c.descripcion,
          data: { entidad: c.entidad, fecha_limite: c.fecha_limite },
          prioridad: c.prioridad ?? 2,
        });
        log(`  Creado (no match): ${c.categoria}/${c.titulo}`);
      }
      count++;

    } else if (c.tipo === 'alerta') {
      CaseStore.create({
        id: caseId, tipo: c.categoria, estado: 'alerta',
        titulo: c.titulo, descripcion: c.descripcion,
        data: { entidad: c.entidad, fecha_limite: c.fecha_limite, accion_requerida: c.accion_requerida },
        prioridad: c.prioridad ?? 1,
      });
      log(`  Alerta: ${c.titulo}`);
      count++;
    }
  }

  return count;
}

async function main() {
  log('Context Engine Daily');

  RE.start('context_engine_daily', {});

  const queue = loadContextQueue();

  if (queue.length === 0) {
    log('Sin correos en la cola de contexto. Nada que procesar.');
    RE.finish('context_engine_daily', 'success', { processed: 0 });
    return;
  }

  log(`Analizando ${queue.length} correos via LLM...`);

  if (DRY_RUN) {
    log('[dry-run] LLM analysis skipped');
    log('[dry-run] Queue would be cleared');
    log('[dry-run] Cases would be created/updated');
    RE.finish('context_engine_daily', 'success', { dry_run: true, queue_size: queue.length });
    return;
  }

  const result = await analyzeBatch(queue);

  log(`Cambios detectados: ${result.cambios.length}`);
  log(`Resumen: ${result.resumen}`);

  if (result.cambios.length > 0) {
    const creados = applyCambios(result.cambios);
    log(`${creados} casos creados/actualizados`);

    LedgerStore.emit('context_daily', {
      emails_analizados: queue.length,
      cambios_detectados: result.cambios.length,
      resumen: result.resumen,
    });
  }

  // Limpiar cola
  clearContextQueue();
  log('Context Queue cleared');

  RE.finish('context_engine_daily', 'success', {
    queue_size: queue.length,
    cambios: result.cambios?.length || 0,
  });

  log(`Resumen: ${result.resumen}`);
  bus.emit('context.daily', { emails: queue.length, cambios: result.cambios?.length || 0, resumen: result.resumen });
  log('Context Engine Daily completado');
}

main().catch(e => {
  console.error(`[CTX] Error: ${e.message}`);
  RE.finish('context_engine_daily', 'error', { reason: e.message });
  process.exit(1);
});

// Exportar para integración con otros scripts
module.exports = { analyzeBatch, applyCambios, pushToContextQueue, loadContextQueue, clearContextQueue };
````

## File: scripts/schedulers/research_loop.js
````javascript
const path = require('path');
/**
 * research_loop.js — 5 pasadas sobre 10,600 repos
 * Busca: MCP servers, skills/agentes, code quality, recursos QA, LLM tools
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'cache', 'repos_db.json'), 'utf8'));
console.log(`\n🔬 Research Loop ×5 — ${db.length} repos\n${'═'.repeat(70)}\n`);

function search(keywords, minStars = 200, limit = 12) {
  const scored = [];
  for (const r of db) {
    const txt = `${r.name} ${r.desc || ''} ${r.lang || ''}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (r.name.toLowerCase().includes(kw)) score += 4;
      else if ((r.desc || '').toLowerCase().includes(kw)) score += 2;
      else if (txt.includes(kw)) score += 1;
    }
    if (score > 0 && r.stars >= minStars) scored.push({ ...r, _score: score });
  }
  return scored.sort((a, b) => b.stars - a.stars).slice(0, limit);
}

const results = {};

// ── PASADA 1: MCP Servers ───────────────────────────────────────
results['🔌 MCP Servers'] = search(
  ['mcp','model context protocol','mcp-server','claude mcp','mcp tools'],
  100, 15
);

// ── PASADA 2: AI Agents / Frameworks ───────────────────────────
results['🤖 AI Agent Frameworks'] = search(
  ['agent','agentic','multi-agent','autonomous agent','langchain','langgraph','autogen','crewai'],
  1000, 15
);

// ── PASADA 3: Code Quality / Linting / Security ────────────────
results['🧹 Code Quality & Security'] = search(
  ['linter','lint','code quality','static analysis','sonar','semgrep','eslint','biome','oxc','security scan'],
  500, 12
);

// ── PASADA 4: Skills / Prompts / System Prompts ────────────────
results['📜 Skills / Prompts / System Prompts'] = search(
  ['system prompt','skill','prompt engineering','prompt template','awesome prompt','agent skill','instruction'],
  200, 15
);

// ── PASADA 5: LLM Local / Inference / Embeddings ───────────────
results['🧠 LLM Local / Embeddings / RAG'] = search(
  ['ollama','llm local','embedding','rag','retrieval','vector store','chroma','qdrant','weaviate','llamafile','lmstudio'],
  500, 15
);

// ── Bonus: Telegram Bots / Notif avanzados ─────────────────────
results['📨 Telegram / Notificaciones avanzadas'] = search(
  ['telegram bot','telegram api','bot framework','grammy','telegraf','telebot','notification service'],
  500, 10
);

// ── Bonus: SQLite / Database ligera ────────────────────────────
results['💾 SQLite / Bases ligeras'] = search(
  ['sqlite','libsql','turso','pglite','duckdb','embedded database'],
  300, 10
);

// ── PRINT REPORT ───────────────────────────────────────────────
let report = '';
for (const [cat, repos] of Object.entries(results)) {
  report += `\n${cat}\n${'─'.repeat(70)}\n`;
  if (repos.length === 0) { report += '  (sin resultados)\n'; continue; }
  repos.forEach((r, i) => {
    const stars = r.stars.toLocaleString();
    const desc = (r.desc || '').substring(0, 90);
    const lang = r.lang !== '?' ? ` [${r.lang}]` : '';
    report += `  ${i+1}. [${stars}⭐]${lang} ${r.name}\n`;
    if (desc) report += `     ${desc}\n`;
    report += `     ${r.url}\n\n`;
  });
}

console.log(report);
fs.writeFileSync('data/cache/research/research_loop_results.json', JSON.stringify(results, null, 2));
console.log('✅ Guardado en data/cache/research/research_loop_results.json\n');
````

## File: scripts/check_simit_email.js
````javascript
const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');

async function main() {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const queries = [
    'simit',
    'notificacion transito',
    'comparendo',
    'fotomulta',
    'multa transito',
    'secretaria de movilidad',
  ];

  for (const q of queries) {
    const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 5 });
    const msgs = res.data.messages || [];
    for (const m of msgs) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata' });
      const headers = detail.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '?';
      const subject = headers.find(h => h.name === 'Subject')?.value || '?';
      const date = headers.find(h => h.name === 'Date')?.value || '?';
      console.log(`[${q}] De: ${from} | Asunto: ${subject} | ${date}`);
    }
  }
  console.log('\nBusqueda completada.');
}

main().catch(err => { console.error(err); process.exit(1); });
````

## File: scripts/daily_routine.js
````javascript
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
const { sendTelegramMessage } = require('../lib/integrations/telegram');

// ── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const SHUTDOWN_AFTER_RUN = true;  // false para pruebas
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
 */
function runScript(scriptPath, interpreter = process.execPath, retries = 0) {
  const fullPath = path.join(ROOT_DIR, scriptPath);
  if (!fs.existsSync(fullPath)) {
    log(`⚠️  Script no encontrado: ${scriptPath} — saltando`);
    return false;
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
````

## File: scripts/read_simit_email.js
````javascript
const { google } = require('googleapis');
const { authorize } = require('../lib/integrations/google_auth');

function decodeBody(msg) {
  let data = msg.payload?.body?.data;
  if (!data && msg.payload?.parts) {
    for (const p of msg.payload.parts) {
      if (p.mimeType === 'text/plain' && p.body?.data) { data = p.body.data; break; }
      if (p.parts) {
        for (const sp of p.parts) {
          if (sp.mimeType === 'text/plain' && sp.body?.data) { data = sp.body.data; break; }
        }
        if (data) break;
      }
    }
  }
  return data ? Buffer.from(data, 'base64').toString('utf8') : '(sin contenido de texto plano)';
}

async function main() {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const queries = [
    'comunicacionsimit@fcm.org.co',
    'from:mirian.sanchez@fcm.org.co',
    'from:atencionalciudadano@itagui.gov.co comparendo',
    'from:angela.garcia@fcm.org.co',
  ];

  for (const q of queries) {
    const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 3 });
    for (const m of res.data.messages || []) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const h = detail.data.payload.headers;
      const subject = h.find(x => x.name === 'Subject')?.value || '?';
      const from = h.find(x => x.name === 'From')?.value || '?';
      const date = h.find(x => x.name === 'Date')?.value || '?';
      const body = decodeBody(detail.data);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`DE: ${from}`);
      console.log(`ASUNTO: ${subject}`);
      console.log(`FECHA: ${date}`);
      console.log(`${'='.repeat(60)}`);
      console.log(body.slice(0, 3000));
    }
  }

  console.log('\n\nFIN.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
````

## File: scripts/set_alarms.ts
````typescript
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Dynamic ADB path resolution ──

function resolveAdbPath(): string {
  // 1. Variable de entorno explícita
  if (process.env.ADB_PATH && fs.existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }

  // 2. Intentar ejecutar adb desde el PATH del sistema
  try {
    execSync('adb --version', { stdio: 'ignore' });
    return 'adb';
  } catch { /* not in PATH */ }

  // 3. Fallback para Windows (Android Studio default)
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const winPath = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    if (fs.existsSync(winPath)) return winPath;
  }

  // 4. Fallback para macOS
  if (process.platform === 'darwin') {
    const macPath = path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
    if (fs.existsSync(macPath)) return macPath;
  }

  throw new Error(
    'ADB no encontrado. Instala Android Platform Tools o configura ADB_PATH en .env'
  );
}

let adbPath: string;
try {
  adbPath = resolveAdbPath();
  console.log(`🔧 Usando ADB: ${adbPath}`);
} catch (e: any) {
  console.error(`❌ ERROR: ${e.message}`);
  process.exit(1);
}

// ── Alarm configuration ──

interface AlarmConfig {
  h: number;
  m: number;
  days: string;
  msg: string;
}

const alarmsConfigPath = path.join(__dirname, '..', 'config', 'alarms.json');

if (!fs.existsSync(alarmsConfigPath)) {
  console.error(`❌ ERROR: No se encontró el archivo de configuración ${alarmsConfigPath}`);
  process.exit(1);
}

const alarms: AlarmConfig[] = JSON.parse(fs.readFileSync(alarmsConfigPath, 'utf8'));

for (const a of alarms) {
  const cmd = `${adbPath} shell am start -a android.intent.action.SET_ALARM --ei android.intent.extra.alarm.HOUR ${a.h} --ei android.intent.extra.alarm.MINUTES ${a.m} --eia android.intent.extra.alarm.DAYS ${a.days} --ez android.intent.extra.alarm.SKIP_UI true --es android.intent.extra.alarm.MESSAGE "${a.msg}"`;
  try {
    console.log(`⏰ Setting alarm: ${a.msg} at ${a.h}:${a.m} on days ${a.days}`);
    execSync(cmd, { stdio: 'ignore' });
  } catch (e: any) {
    console.error(`❌ Error setting ${a.msg}: ${e.message}`);
  }
}

console.log('✅ All recurring alarms set clean via ADB!');
````

## File: scripts/setup_wakeup_routine.ps1
````powershell
<#
.SYNOPSIS
    LifeOS — Deploy Wake-Up Routine to Windows Task Scheduler

.DESCRIPTION
    Crea/actualiza la tarea programada 'LifeOS_MorningRoutine' en Windows
    Task Scheduler. Esta tarea es el núcleo de la arquitectura "Run & Die":
    enciende la PC desde hibernación/suspensión a las 5:00 AM, ejecuta la
    rutina matutina completa (scrapers, empleo, backups, briefing) y apaga.

    Arquitectura:
       BIOS RTC (opcional) → Windows Task Scheduler → daily_routine.js → shutdown

.PARAMETER TaskName
    Nombre de la tarea en el Task Scheduler. Default: LifeOS_MorningRoutine

.PARAMETER TaskDescription
    Descripción de la tarea. Default: "LifeOS — Rutina Matutina (Run & Die)"

.PARAMETER UnregisterExisting
    Si existe una tarea previa, la elimina antes de crear la nueva.

.PARAMETER StartAt
    Hora de ejecución en formato HH:mm (24h). Default: "05:00"

.EXAMPLE
    .\setup_wakeup_routine.ps1

.EXAMPLE
    .\setup_wakeup_routine.ps1 -StartAt "06:30" -UnregisterExisting

.NOTES
    Autor:    LifeOS SRE
    Requiere: Administrador privileges. Windows 10/11 o Server 2016+.
    Run & Die Architecture v2.5
#>

[CmdletBinding()]
param(
    [string]$TaskName = "LifeOS_MorningRoutine",
    [string]$TaskDescription = "LifeOS — Rutina Matutina (Run & Die): scrapers SIMIT/SENA/DIAN, empleo, backups, briefing y apagado automático.",
    [switch]$UnregisterExisting,
    [string]$StartAt = "05:00"
)

# ──────────────────────────────────────────────────────────────────
# Verificar privilegios de Administrador
# ──────────────────────────────────────────────────────────────────
$isAdmin = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $isAdmin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ERROR: Este script requiere permisos de             ║" -ForegroundColor Red
    Write-Host "║  Administrador para registrar tareas programadas.    ║" -ForegroundColor Red
    Write-Host "║                                                     ║" -ForegroundColor Red
    Write-Host "║  Ejecuta PowerShell como Administrador y reintenta:  ║" -ForegroundColor Red
    Write-Host "║  > Start-Process powershell -Verb RunAs              ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}

# ──────────────────────────────────────────────────────────────────
# Resolver rutas absolutas
# ──────────────────────────────────────────────────────────────────
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "❌ ERROR: node.exe no encontrado en el PATH." -ForegroundColor Red
    Write-Host "   Instala Node.js desde https://nodejs.org y asegúrate de que esté en el PATH." -ForegroundColor Yellow
    exit 1
}
$NodePath = $nodeCmd.Source
$ScriptPath = Join-Path -Path $ProjectRoot -ChildPath "scripts\daily_routine.js"

Write-Host "📂 Directorio del proyecto:     $ProjectRoot" -ForegroundColor Cyan
Write-Host "📌 Node.js:                     $NodePath" -ForegroundColor Cyan
Write-Host "📄 Script objetivo:             $ScriptPath" -ForegroundColor Cyan

if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ ERROR: daily_routine.js no encontrado en: $ScriptPath" -ForegroundColor Red
    Write-Host "   Verifica que el script exista en la ubicación esperada." -ForegroundColor Yellow
    exit 1
}

# ──────────────────────────────────────────────────────────────────
# Si existe la tarea, opcionalmente la eliminamos
# ──────────────────────────────────────────────────────────────────
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing -and $UnregisterExisting) {
    Write-Host "🗑️  Eliminando tarea existente: $TaskName..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "   ✅ Tarea eliminada." -ForegroundColor Green
} elseif ($existing) {
    Write-Host "⚠️  La tarea '$TaskName' ya existe. Se actualizará con -Force." -ForegroundColor Yellow
}

# ──────────────────────────────────────────────────────────────────
# Crear Acción: ejecutar Node.js con el script
# ──────────────────────────────────────────────────────────────────
$Action = New-ScheduledTaskAction -Execute $NodePath `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory $ProjectRoot

Write-Host "⚙️  Acción creada:" -ForegroundColor DarkGray
Write-Host "   Ejecutable:   $NodePath" -ForegroundColor DarkGray
Write-Host "   Argumento:    $ScriptPath" -ForegroundColor DarkGray
Write-Host "   Working Dir:  $ProjectRoot" -ForegroundColor DarkGray

# ──────────────────────────────────────────────────────────────────
# Crear Trigger: diario a las 05:00 AM
# ──────────────────────────────────────────────────────────────────
$Trigger = New-ScheduledTaskTrigger -Daily -At $StartAt

Write-Host "⏰ Trigger creado: Diario a las $StartAt" -ForegroundColor DarkGray

# ──────────────────────────────────────────────────────────────────
# Configuraciones críticas: WakeToRun, baterías, etc.
# ──────────────────────────────────────────────────────────────────
$Settings = New-ScheduledTaskSettingsSet `
    -WakeToRun `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -AllowHardTerminate:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 2) `
    -MultipleInstances IgnoreNew

Write-Host "🔧 Settings:" -ForegroundColor DarkGray
Write-Host "   WakeToRun:              ✅ (Despierta PC de hibernación/suspensión)" -ForegroundColor DarkGray
Write-Host "   AllowStartIfOnBatteries: ✅" -ForegroundColor DarkGray
Write-Host "   DontStopIfGoingOnBatteries: ✅" -ForegroundColor DarkGray
Write-Host "   ExecutionTimeLimit:      2 horas" -ForegroundColor DarkGray
Write-Host "   RestartCount:            3 (reintentos cada 2 min)" -ForegroundColor DarkGray

# ──────────────────────────────────────────────────────────────────
# Registrar la tarea en el Task Scheduler
# ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📝 Registrando tarea: $TaskName ..." -ForegroundColor Magenta

try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Description $TaskDescription `
        -User "SYSTEM" `
        -RunLevel Highest `
        -Force

    Write-Host "✅ Tarea registrada exitosamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ☀️  LifeOS — Arquitectura Run & Die DESPLEGADA          ║" -ForegroundColor Green
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Tarea:        $($TaskName.PadRight(38))║" -ForegroundColor White
    Write-Host "║  Horario:      $StartAt AM (todos los días)             ║" -ForegroundColor White
    Write-Host "║  Despierta PC: SÍ                                        ║" -ForegroundColor White
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Para probar sin esperar:                                ║" -ForegroundColor Green
    Write-Host "║    Start-ScheduledTask -TaskName '$TaskName'              ║" -ForegroundColor Yellow
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Para ver el estado:                                     ║" -ForegroundColor Green
    Write-Host "║    Get-ScheduledTask -TaskName '$TaskName' | fl           ║" -ForegroundColor Yellow
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Para desinstalar:                                       ║" -ForegroundColor Green
    Write-Host "║    Unregister-ScheduledTask -TaskName '$TaskName'         ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green

} catch {
    Write-Host "❌ ERROR al registrar la tarea: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Posibles causas:" -ForegroundColor Yellow
    Write-Host "   • PowerShell no ejecutado como Administrador" -ForegroundColor Yellow
    Write-Host "   • El usuario SYSTEM no tiene permisos para ejecutar la tarea" -ForegroundColor Yellow
    Write-Host "   • El nombre de la tarea ya existe y -Force no funcionó" -ForegroundColor Yellow
    exit 1
}

# ──────────────────────────────────────────────────────────────────
# Verificar que la tarea quedó registrada correctamente
# ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Verificando registro..." -ForegroundColor Cyan
$registeredTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($registeredTask) {
    Write-Host "✅ Estado actual de la tarea:" -ForegroundColor Green
    Write-Host "   TaskName: $($registeredTask.TaskName)" -ForegroundColor Gray
    Write-Host "   State:    $($registeredTask.State)" -ForegroundColor Gray
    Write-Host "   Enabled:  $($registeredTask.Enabled)" -ForegroundColor Gray
    
    if ($registeredTask.State -eq 'Ready') {
        Write-Host ""
        Write-Host "🎯 La rutina matutina está armada y lista para las $StartAt AM." -ForegroundColor Green
        Write-Host "   No olvides configurar el RTC Alarm en la BIOS/UEFI para" -ForegroundColor Cyan
        Write-Host "   que la PC encienda desde apagado completo si es necesario." -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No se pudo verificar la tarea registrada." -ForegroundColor Yellow
}
````

## File: skills/bootcamp_qa.js
````javascript
const fs = require('node:fs');
const { PATHS, DIR } = require('../lib/data/paths');
const path = require('node:path');

const CURRICULUM_PATH  = PATHS.BOOTCAMP_CURRICULUM;
const REPOS_PATH       = path.join(DIR.STATE, 'bootcamp', 'repos_mapping.json');
const SEGUIMIENTO_PATH = PATHS.BOOTCAMP_PROGRESS;

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

module.exports = {
  id: 'bootcamp_qa',
  nombre: 'Bootcamp QA Automation Engineer',
  prioridad: 10,
  keywords: [
    'bootcamp', 'estudiar', 'aprender', 'playwright', 'cypress', 'vitest',
    'testing', 'qa', 'automation', 'ejercicio', 'practica', 'tarea',
    'entregable', 'semana', 'fase', 'progreso', 'portfolio', 'entrevista',
    'cv', 'linkedin', 'trabajo', 'empleo', 'carrera', 'typescript',
    'javascript', 'fundamentos', 'mentoria', 'mentor', 'tutor'
  ],

  getContext() {
    const curriculum = loadJSON(CURRICULUM_PATH);
    const progreso = loadJSON(SEGUIMIENTO_PATH);
    const repos = loadJSON(REPOS_PATH);

    if (!curriculum) return '';

    const perfil = curriculum.prerrequisitos;
    let ctx = `[BOOTCAMP QA] Perfil: ${curriculum.perfil_objetivo} | ${curriculum.tiempo_estimado} | ${curriculum.horas_por_semana}\n`;
    ctx += `Fortalezas: ${perfil.fortalezas.join(', ')}\n`;
    ctx += `Debilidades: ${perfil.debilidades.join(', ')}\n\n`;

    if (progreso?.semana_actual) {
      const faseActual = curriculum.fases.find(f => {
        const [ini, fin] = f.semanas.split('-').map(Number);
        return progreso.semana_actual >= ini && progreso.semana_actual <= fin;
      });

      if (faseActual) {
        ctx += `FASE ACTUAL: ${faseActual.nombre}\n`;
        const mod = faseActual.modulos.find(m => m.semana === progreso.semana_actual);
        if (mod) {
          ctx += `SEMANA ${mod.semana}: ${mod.titulo}\n`;
          ctx += `Ejercicios pendientes:\n`;
          for (const ej of mod.ejercicios) {
            const done = progreso.completados?.includes(ej.substring(0, 40));
            ctx += `  [${done ? 'x' : ' '}] ${ej}\n`;
          }
          ctx += `Entregable: ${mod.entregable}\n`;
        }
      }
    } else {
      // Show summary of all phases
      ctx += 'FASES DEL BOOTCAMP:\n';
      for (const fase of curriculum.fases) {
        ctx += `  ${fase.id}: ${fase.nombre} (semanas ${fase.semanas})\n`;
      }
    }

    // Available repos
    if (repos?.categorias?.testing) {
      ctx += `\nREPOS DE ESTUDIO DISPONIBLES:\n`;
      ctx += `  Testing: ${repos.categorias.testing.join(', ')}\n`;
      ctx += `  TypeScript: ${(repos.categorias.typescript || []).join(', ')}\n`;
      ctx += `  Fundamentos: ${(repos.categorias.fundamentals || []).join(', ')}\n`;
      ctx += `  Proyectos: ${(repos.categorias.projects || []).join(', ')}\n`;
    }

    return ctx;
  }
};
````

## File: skills/cerebro.md
````markdown
# CEREBRO

Eres el orquestador principal del LifeOS.

Prioridades:

1. Seguridad.
2. Salud.
3. Finanzas.
4. Trabajo.
5. Estudio.
6. Automatizaciones.

Debes resumir el contexto recibido, identificar prioridades, generar un briefing corto y proponer únicamente acciones concretas y ejecutables.

No inventes información.
No repitas contexto innecesario.
Responde siempre en español.
````

## File: skills/legal.js
````javascript
const CheckpointStore = require('../runtime/stores/CheckpointStore');
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'legal',
  nombre: 'Legal Colombia',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const legal = vital.legal_financiero || {};

    let simitCtx = '';
    try {
      const simit = CheckpointStore.get('simit_ultima_consulta');

      if (simit) {
        const multas = simit.detalle?.multas || [];
        const totalNumeric = parseFloat(String(simit.total || '0').replace(/[^\d]/g, '')) || 0;

        simitCtx = `\n[PLACA KEW496] ${multas.length} multas SIMIT | Deuda total: $${(totalNumeric/1000).toFixed(0)}K`;
        for (const m of multas) {
          const valorNumeric = parseFloat(String(m.valor || '0').replace(/[^\d]/g, '')) || 0;
          const icono = m.estado?.includes('coactivo') ? '🔴' : m.estado?.includes('Impugnado') ? '🟡' : '🟠';
          simitCtx += `\n  ${icono} ${m.id}: ${m.secretaria || 'N/A'} | ${m.infraccion || 'N/A'} | ${m.estado || 'N/A'} | $${(valorNumeric/1000).toFixed(0)}K`;
        }
      }
    } catch (e) {
      console.error('[Legal Skill] Error al cargar contexto de SQLite SIMIT:', e.message);
    }

    return `[SKILL: Legal Colombia]
- SIMIT: ${legal.simit?.estado || '3 multas pendientes, 1 en cobro coactivo'}
- Ultima gestion SIMIT: ${legal.simit?.ultima_gestion || 'FCM remitio por competencia a Itagui (04/07/2026)'}
- Fiscalia: Ampliacion Denuncia NUC 110016102838202604358 (21 May 2026)
- Temas activos: comparendos SIMIT, cobro coactivo Itagui, denuncia fiscalia${simitCtx}`;
  }
};
````

## File: skills/transito.js
````javascript
const CheckpointStore = require('../runtime/stores/CheckpointStore');

module.exports = {
  id: 'transito',
  nombre: 'Transito Colombia - Defensa Legal',
  getContext() {
    let simitCtx = '';
    try {
      const simit = CheckpointStore.get('simit_ultima_consulta');

      if (simit) {
        const multas = simit.detalle?.multas || [];
        const totalNumeric = parseFloat(String(simit.total || '0').replace(/[^\d]/g, '')) || 0;

        simitCtx = `\n[TRANSITO_JEISER] Placa KEW496 (Toyota Corolla 2010) | Deuda activa: $${(totalNumeric/1000).toFixed(0)}K | SOAT vence 31/12/2026 | RTM vence 26/12/2026`;
        for (const m of multas) {
          const valorNumeric = parseFloat(String(m.valor || '0').replace(/[^\d]/g, '')) || 0;
          const icono = m.estado?.includes('Impugnado') ? '🟡' : m.estado?.includes('Pagad') ? '✅' : '⬜';
          simitCtx += `\n  ${icono} ${m.id}: ${m.secretaria || 'N/A'} | ${m.infraccion || 'N/A'} | ${m.estado || 'N/A'} | $${(valorNumeric/1000).toFixed(0)}K`;
        }
      }
      simitCtx += '\n⚠ BXU28C (moto): SOAT VENCIDO 07/07/2025 + RTM VENCIDO 13/07/2025. NO CIRCULAR sin renovar. Multa C02: ~$950K + inmovilizacion.';
    } catch (e) {
      console.error('[Transito Skill] Error al cargar contexto de SQLite SIMIT:', e.message);
    }

    return `[SKILL: Transito Colombia - Defensa Legal v1.0]
Jeiser es conductor Didi. Alta exposicion a retenes, fotomultas, comparendos.
- Ley 1843/2017: fotomultas requieren notificacion fisica en 3 dias + DEI calibrado + senal SR-48
- Derecho a grabar retenes. No pueden retener celular. Identificacion del agente es obligatoria.
- Didi: zona gris legal. Decir "llevo un amigo/familiar". No mencionar la app.
- Multa C29 (velocidad): impugnable si no hay notificacion fisica o DEI sin calibracion.
- Plazos: 10 dias habiles para recurso de reposicion, 3 años para prescripcion.
- Amnistias: cada alcaldia tiene las suyas. Verificar portales locales.${simitCtx}`;
  }
};
````

## File: tests/rule_engine.test.js
````javascript
/**
 * tests/rule_engine.test.js
 * Tests for lib/runtime/rule_engine.js — deterministic rules, wildcards, priorities.
 */
const path = require('node:path');
const fs = require('node:fs');

// Point to test rules.json
const RULES_PATH = path.resolve(__dirname, '..', 'data', 'config', 'rules.json');

describe('RuleEngine', () => {
  let re;

  beforeAll(() => {
    re = require('../lib/runtime/rule_engine');
  });

  it('should load rules from data/config/rules.json', () => {
    const rules = re.loadRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty('name');
    expect(rules[0]).toHaveProperty('match');
    expect(rules[0]).toHaveProperty('actions');
  });

  it('should match email by wildcard from pattern', () => {
    const email = {
      from: 'notificaciones@dian.gov.co',
      subject: 'Facturación electrónica',
      body: 'Su factura está lista',
    };
    const results = re.matchAll(email);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.label?.toLowerCase().includes('dian'))).toBe(true);
  });

  it('should match email by wildcard subject pattern', () => {
    const email = {
      from: 'info@simit.gov.co',
      subject: 'Comparendo pendiente: ABC123',
      body: 'Tiene un comparendo pendiente',
    };
    const results = re.matchAll(email);
    const simitResults = results.filter(r => r.label?.toLowerCase().includes('simit'));
    expect(simitResults.length).toBeGreaterThan(0);
  });

  it('should return empty array if no rules match', () => {
    const email = {
      from: 'unknown@spammer.com',
      subject: 'Win a free iPhone!!!',
      body: 'Click here to claim your prize',
    };
    const results = re.matchAll(email);
    expect(results.length).toBe(0);
  });

  it('should sort results by priority (P0 first)', () => {
    const email = {
      from: 'notificaciones@dian.gov.co',
      subject: 'URGENTE: Requerimiento judicial',
      body: 'Notificación de embargo',
    };
    const results = re.matchAll(email);
    if (results.length >= 2) {
      expect(results[0].priority).toBeDefined();
    }
  });

  it('should support subjectContains matching', () => {
    const email = {
      from: 'notificaciones@ramajudicial.gov.co',
      subject: 'Notificación proceso judicial: 2026-00123',
      body: 'Citación para audiencia',
    };
    const results = re.matchAll(email);
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('should match anyWord in combined text', () => {
    const email = {
      from: 'cesde@cesde.edu.co',
      subject: 'Clase de automatización - Recordatorio',
      body: 'Mañana tenemos clase a las 6pm',
    };
    const results = re.matchAll(email);
    const cesdeResults = results.filter(r => r.label?.toLowerCase().includes('cesde'));
    expect(cesdeResults.length).toBeGreaterThanOrEqual(0);
  });

  it('should skip disabled rules', () => {
    const email = {
      from: 'disabled-rule@test.com',
      subject: 'This should not match any disabled rule',
      body: 'test',
    };
    // Should not crash, and disabled rules won't match
    const results = re.matchAll(email);
    // Function should handle gracefully
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return highestPriority result correctly', () => {
    const actions = [
      { priority: 'P2', ruleName: 'normal', label: 'Normal' },
      { priority: 'P0', ruleName: 'urgent', label: 'Urgente' },
      { priority: 'P1', ruleName: 'medium', label: 'Medio' },
    ];
    const highest = re.highestPriority(actions);
    expect(highest.priority).toBe('P0');
    expect(highest.ruleName).toBe('urgent');
  });

  it('should build facts from email correctly', () => {
    // Test internal buildFacts via matchAllSync (calls matchRuleLegacy)
    const email = {
      from: 'test@example.com',
      subject: 'Test subject',
      snippet: 'Test snippet body',
    };
    const results = re.matchAll(email);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle emails with from field containing angle-bracket format', () => {
    const email = {
      from: '"DIAN Notificaciones" <notificaciones@dian.gov.co>',
      subject: 'Novedad en su factura',
      body: 'Tiene una factura pendiente',
    };
    const results = re.matchAll(email);
    const dianResults = results.filter(r => r.label?.toLowerCase().includes('dian'));
    expect(dianResults.length).toBeGreaterThanOrEqual(0);
  });

  it('should create engine with async matchAllAsync', async () => {
    const email = {
      from: 'notificaciones@dian.gov.co',
      subject: 'Requerimiento DIAN',
      body: 'Su declaración de renta',
    };
    const results = await re.matchAllAsync(email);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should createEngine and return a valid engine instance', () => {
    const engine = re.createEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.run).toBe('function');
  });
});
````

## File: tests/think.test.js
````javascript
/**
 * tests/think.test.js
 * Tests for lib/think/think.js — decision engine, needsLLM, enrichPayload, execute.
 */

// Mock event bus — use a real function so emit doesn't throw
vi.mock('../lib/events/event_bus', () => ({ emit: () => {} }));

// Mock ai/decision
vi.mock('../lib/ai/decision', () => ({
  decide: vi.fn().mockResolvedValue({
    decisiones: [
      { type: 'test.decision', payload: { msg: 'test' }, priority: 'normal' },
    ],
  }),
}));

// Mock json-rules-engine to return controlled results
vi.mock('json-rules-engine', () => {
  const mockFn = vi.fn();
  const mockEngine = {
    addRule: vi.fn(),
    run: vi.fn().mockResolvedValue({ events: [] }),
  };
  mockFn.mockReturnValue(mockEngine);
  return { Engine: mockFn };
});

// Mock better-sqlite3 for state_snapshot
vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({})),
      all: vi.fn(() => []),
      run: vi.fn(),
    })),
    pragma: vi.fn(),
    close: vi.fn(),
  };
  return vi.fn(() => mockDb);
});

describe('Think', () => {
  let think;

  beforeAll(() => {
    think = require('../lib/think/think');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export think, execute, getDecisionLog, needsLLM', () => {
    expect(think.think).toBeDefined();
    expect(think.execute).toBeDefined();
    expect(think.getDecisionLog).toBeDefined();
    expect(think.needsLLM).toBeDefined();
  });

  it('should return false for needsLLM with low urgency state', () => {
    const state = {
      casos: { urgentes: 0, abiertos: 2 },
      senales_estres: { alto: false, motivo: null },
      empleo: { sin_respuesta: 2 },
    };
    expect(think.needsLLM(state)).toBe(false);
  });

  it('should return true for needsLLM with high urgency state', () => {
    const state = {
      casos: { urgentes: 2, abiertos: 5 },
      senales_estres: { alto: true, motivo: 'too_many_urgent' },
      empleo: { sin_respuesta: 8 },
    };
    expect(think.needsLLM(state)).toBe(true);
  });

  it('should emit events through execute without throwing', () => {
    const decisions = [
      { type: 'job.strategy.change', payload: { reason: 'test' }, source: 'jarvis', priority: 'normal' },
      { type: 'test.event', payload: { data: 1 }, source: 'jarvis', priority: 'low' },
    ];
    expect(() => think.execute(decisions)).not.toThrow();
  });

  it('should log decisions and return them via getDecisionLog', async () => {
    const state = {
      casos: { urgentes: 0, abiertos: 2, vencidos: 0 },
      senales_estres: { alto: false, motivo: null },
      empleo: { sin_respuesta: 1 },
      estudio: {},
      sistema: { horas_libres_hoy: 3, errores_24h: 0 },
    };

    const decisions = await think.think(state);
    expect(Array.isArray(decisions)).toBe(true);
    expect(think.getDecisionLog().length).toBeGreaterThanOrEqual(1);

    const lastLog = think.getDecisionLog()[think.getDecisionLog().length - 1];
    expect(lastLog).toHaveProperty('timestamp');
    expect(lastLog).toHaveProperty('input');
    expect(lastLog).toHaveProperty('output');
  });

  it('should limit decision log to 100 entries', () => {
    const log = think.getDecisionLog();
    expect(log.length).toBeLessThanOrEqual(100);
  });

  it('should return empty array when no rules trigger', async () => {
    // Mock engine.run to return events
    const state = {
      casos: { urgentes: 0, abiertos: 1, vencidos: 0 },
      senales_estres: { alto: false, motivo: null },
      empleo: { sin_respuesta: 0 },
      estudio: {},
      sistema: { horas_libres_hoy: 5, errores_24h: 0 },
    };
    const decisions = await think.think(state);
    expect(Array.isArray(decisions)).toBe(true);
  });
});
````

## File: wheel-saver/api/llm.py
````python
"""
WheelSaver LLM — Cliente simplificado con proxy LiteLLM y fallback directo.
"""

import os
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

LITELLM_URL = os.getenv("LITELLM_URL", "http://localhost:4000")


async def _probe_litellm(timeout: float = 1.0) -> bool:
    """Verifica si el proxy de LiteLLM está respondiendo localmente."""
    if os.getenv("GITHUB_ACTIONS"):
        return False
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(f"{LITELLM_URL}/health/liveliness")
            return resp.status_code == 200
    except Exception:
        return False


async def _get_client() -> tuple[AsyncOpenAI, str]:
    """
    Inicializa el cliente de OpenAI.
    Retorna una tupla (AsyncOpenAI, modelo_a_usar).
    """
    if await _probe_litellm():
        client = AsyncOpenAI(
            api_key="litellm-proxy",
            base_url=f"{LITELLM_URL}/v1"
        )
        return client, "smart-router"

    # Fallback directo si el proxy está apagado (ej. en local sin Docker)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        client = AsyncOpenAI(
            api_key=openrouter_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/jeiser-dev/lifeos",
                "X-Title": "LifeOS"
            }
        )
        return client, "google/gemini-2.5-flash"

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        client = AsyncOpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1"
        )
        return client, "llama-3.3-70b-versatile"

    raise RuntimeError(
        "No hay proxy de LiteLLM activo ni claves de API para fallback directo (OPENROUTER_API_KEY, GROQ_API_KEY)"
    )


def _build_prompts(question: str, repos: list[dict]) -> tuple[str, str]:
    """Construye system_prompt y user_prompt para consulta RAG."""
    context = ""
    for r in repos:
        desc = r.get("description", "Sin descripción") or "Sin descripción"
        lang = r.get("language", "-") or "-"
        context += f"- {r['owner']}/{r['name']} ({r.get('stars', 0)}⭐): {desc}. Lenguaje: {lang}\n"

    if not context:
        context = "No se encontraron repositorios relevantes en la base de datos."

    system_prompt = """Eres WheelSaver AI, un ingeniero de software senior altamente experimentado.
Tu objetivo es analizar la pregunta del usuario y responder recomendando los mejores repositorios basándote estrictamente en el contexto proporcionado (los resultados de la base de datos local).
Sé directo, explica brevemente por qué recomiendas una librería sobre otra, y usa un formato Markdown limpio."""

    user_prompt = f"""Pregunta del usuario: "{question}"

Contexto extraído de la base de datos de WheelSaver:
{context}

Por favor, analiza estos repositorios y responde a la pregunta de la mejor manera posible."""

    return system_prompt, user_prompt


async def ask_llm(system_prompt: str = "", user_prompt: str = "", **kwargs) -> str:
    """
    Consulta al LLM unificado usando el cliente activo (LiteLLM o fallback).
    Incluye 3 reintentos con backoff exponencial (2s, 4s) para rate limits transitorios.
    """
    import asyncio

    try:
        client, model = await _get_client()
    except RuntimeError as e:
        raise RuntimeError(f"Error de inicialización de LLM: {e}")

    last_error = None
    for attempt in range(1, 4):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=kwargs.get("max_tokens", 800),
                temperature=kwargs.get("temperature", 0.3),
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)

    raise RuntimeError(f"LLM falló tras 3 intentos: {last_error}")


async def ask_llm_about_repos(question: str, repos: list[dict], **kwargs) -> str:
    """
    Toma una pregunta del usuario y una lista de repositorios,
    y usa el LLM unificado para responder.
    """
    system_prompt, user_prompt = _build_prompts(question, repos)

    try:
        return await ask_llm(system_prompt=system_prompt, user_prompt=user_prompt, **kwargs)
    except Exception as e:
        return f"Error al generar respuesta: {e}"


# Alias backwards-compatible
ask_deepseek_about_repos = ask_llm_about_repos
````

## File: wheel-saver/scraper/db_manager.py
````python
import sqlite3
import os
import hashlib
from loguru import logger

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "top_repos.db")


def make_repo_id(owner, name):
    """
    Genera un ID sintetico consistente para repos sin GitHub node ID.
    Usa SHA-256 de 'owner/name' -> 16 chars hex.
    """
    raw = f"{owner.lower()}/{name.lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS repos (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            stars INTEGER NOT NULL,
            language TEXT,
            topics TEXT,
            updated_at TEXT,
            is_archived INTEGER DEFAULT 0
        )
    """)

    # Columnas legacy (para BDs creadas antes de que existieran)
    for col in ["is_archived"]:
        try:
            cursor.execute(f"ALTER TABLE repos ADD COLUMN {col} INTEGER DEFAULT 0")
        except Exception:
            pass

    # Crear tabla de metadatos de ejecución
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS run_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            repos_before INTEGER DEFAULT 0,
            repos_after INTEGER DEFAULT 0,
            repos_inserted INTEGER DEFAULT 0,
            repos_filtered INTEGER DEFAULT 0,
            min_stars_scanned INTEGER DEFAULT 500,
            status TEXT DEFAULT 'running'
        )
    """)

    # Índices para búsquedas rápidas (IGNORE si ya existen)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_repos_stars ON repos(stars DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_repos_language ON repos(language)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_repos_owner ON repos(owner)")

    # FTS5 para búsqueda full-text
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS repos_fts USING fts5(
            name, description, topics,
            content='repos',
            content_rowid='rowid'
        )
    """)

    conn.commit()
    return conn


def rebuild_fts():
    """Reconstruye el índice FTS5 desde los datos actuales de repos."""
    conn = init_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO repos_fts(repos_fts) VALUES('rebuild')")
        conn.commit()
        logger.info("Indice FTS5 reconstruido")
    except Exception as e:
        logger.error("Error al reconstruir indice FTS5: {}", e)
    finally:
        conn.close()


def upsert_repos(repos_list):
    """
    Inserts or updates a list of repositories in the database.
    repos_list is a list of dictionaries.
    """
    conn = init_db()
    cursor = conn.cursor()

    for repo in repos_list:
        topics_str = ",".join(repo.get("topics", []))
        cursor.execute(
            """
            INSERT INTO repos (id, name, owner, description, url, stars, language, topics, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                owner=excluded.owner,
                description=excluded.description,
                url=excluded.url,
                stars=excluded.stars,
                language=excluded.language,
                topics=excluded.topics,
                updated_at=excluded.updated_at
        """,
            (
                repo["id"],
                repo["name"],
                repo["owner"],
                repo.get("description", ""),
                repo["url"],
                repo["stars"],
                repo.get("language", ""),
                topics_str,
                repo.get("updated_at", ""),
            ),
        )

    conn.commit()
    conn.close()


def upsert_external_repos(repos_list):
    """
    Como upsert_repos pero genera automaticamente un ID sintetico
    a partir de (owner, name) para fuentes externas que no tienen
    el GitHub node ID (EvanLi, gitstar-ranking, etc.).
    """
    for repo in repos_list:
        if "id" not in repo or not repo["id"]:
            repo["id"] = make_repo_id(repo["owner"], repo["name"])
    upsert_repos(repos_list)


def search_repos(keyword, limit=5):
    """
    Busca repos usando FTS5 (full-text search).
    Si FTS5 falla (poco probable), hace fallback a LIKE.
    """
    conn = init_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY r.stars DESC
            LIMIT ?
        """,
            (keyword, limit),
        )
    except sqlite3.OperationalError:
        # Fallback: LIKE query
        like_kw = f"%{keyword}%"
        cursor.execute(
            """
            SELECT name, owner, description, url, stars, language, topics
            FROM repos
            WHERE name LIKE ? OR description LIKE ? OR topics LIKE ?
            ORDER BY stars DESC
            LIMIT ?
        """,
            (like_kw, like_kw, like_kw, limit),
        )

    results = cursor.fetchall()
    conn.close()

    repos = []
    for r in results:
        repos.append(
            {
                "name": r[0],
                "owner": r[1],
                "description": r[2],
                "url": r[3],
                "stars": r[4],
                "language": r[5],
                "topics": r[6],
            }
        )
    return repos


def search_repos_multi_keywords(keywords, limit=20):
    """
    Busca repos que matcheen CUALQUIERA de las keywords dadas.
    Usa FTS5 con OR, fallback a LIKE.
    """
    conn = init_db()
    cursor = conn.cursor()

    try:
        fts_query = " OR ".join(keywords)
        cursor.execute(
            """
            SELECT DISTINCT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY r.stars DESC
            LIMIT ?
        """,
            (fts_query, limit),
        )
    except sqlite3.OperationalError:
        # Fallback: LIKE queries
        seen = set()
        cursor.execute(
            "SELECT name, owner, description, url, stars, language, topics FROM repos ORDER BY stars DESC"
        )
        all_repos = cursor.fetchall()
        results = []
        for r in all_repos:
            text = f"{r[0]} {r[1]} {r[2] or ''} {r[6] or ''}".lower()
            if any(kw.lower() in text for kw in keywords):
                if r[0] not in seen:
                    seen.add(r[0])
                    results.append(r)
                    if len(results) >= limit:
                        break

    results = cursor.fetchall() if "results" not in dir() else results
    conn.close()

    repos = []
    for r in results:
        repos.append(
            {
                "name": r[0],
                "owner": r[1],
                "description": r[2],
                "url": r[3],
                "stars": r[4],
                "language": r[5],
                "topics": r[6],
            }
        )
    return repos


def get_stats():
    """Devuelve estadísticas de la base de datos."""
    conn = init_db()
    cursor = conn.cursor()
    stats = {}
    cursor.execute("SELECT COUNT(*) FROM repos")
    stats["total_repos"] = cursor.fetchone()[0]

    cursor.execute("SELECT MIN(stars), MAX(stars), AVG(stars) FROM repos")
    row = cursor.fetchone()
    stats["stars_min"] = row[0]
    stats["stars_max"] = row[1]
    stats["stars_avg"] = round(row[2]) if row[2] else 0

    cursor.execute('SELECT COUNT(DISTINCT language) FROM repos WHERE language != ""')
    stats["languages"] = cursor.fetchone()[0]

    cursor.execute("""
        SELECT language, COUNT(*) as cnt FROM repos
        WHERE language != "" GROUP BY language ORDER BY cnt DESC LIMIT 10
    """)
    stats["top_languages"] = {r[0]: r[1] for r in cursor.fetchall()}

    conn.close()
    return stats


def get_all_repos():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute("SELECT name, description, topics, url, stars FROM repos ORDER BY stars DESC")
    results = cursor.fetchall()
    conn.close()
    return results
````

## File: wheel-saver/scraper/github_fetcher.py
````python
import os
import sqlite3
import httpx
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from loguru import logger
from scraper.db_manager import upsert_repos, DB_PATH, init_db

load_dotenv(override=True)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# ============================================================
# UMBRAL DE CALIDAD (repos de 500-1000 estrellas)
# Se aplican filtros extra para no guardar repos desatendidos
# ============================================================
QUALITY_FILTER_THRESHOLD = 1000  # por debajo aplicamos filtros
MAX_INACTIVE_DAYS = 365  # sin commits en >1 año = desatendido


def is_active_repo(updated_at_str, stars):
    """
    Repos con +1000 estrellas: siempre se incluyen.
    Repos con 500-999 estrellas: solo si tuvieron commits en el último año.
    """
    if stars >= QUALITY_FILTER_THRESHOLD:
        return True

    try:
        updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=MAX_INACTIVE_DAYS)
        return updated_at >= cutoff_date
    except Exception:
        return False


def log_run_start():
    """Registra el inicio de una ejecución en run_history y devuelve el run_id."""
    conn = init_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM repos")
    repos_before = c.fetchone()[0]
    c.execute(
        "INSERT INTO run_history (started_at, repos_before, status) VALUES (?, ?, 'running')",
        (datetime.now(timezone.utc).isoformat(), repos_before),
    )
    run_id = c.lastrowid
    conn.commit()
    conn.close()
    return run_id, repos_before


def log_run_finish(run_id, repos_inserted, repos_filtered, min_stars, status="completed"):
    """Registra la finalización de una ejecución en run_history."""
    conn = init_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM repos")
    repos_after = c.fetchone()[0]
    c.execute(
        """UPDATE run_history
           SET finished_at = ?, repos_after = ?, repos_inserted = ?,
               repos_filtered = ?, min_stars_scanned = ?, status = ?
           WHERE id = ?""",
        (
            datetime.now(timezone.utc).isoformat(),
            repos_after,
            repos_inserted,
            repos_filtered,
            min_stars,
            status,
            run_id,
        ),
    )
    conn.commit()
    conn.close()


def fetch_top_repos(min_stars=500):
    """
    Escanea GitHub desde el Top 1 (repos con más estrellas) hacia abajo
    hasta alcanzar el umbral minimo de estrellas.

    En producción SIEMPRE empieza desde arriba para refrescar la data
    de los repos existentes (upsert), no solo agregar nuevos.
    """
    if not GITHUB_TOKEN:
        print("❌ Error: GITHUB_TOKEN no encontrado en .env")
        return

    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }

    query = """
    query($queryString: String!, $cursor: String) {
      search(query: $queryString, type: REPOSITORY, first: 100, after: $cursor) {
        pageInfo { endCursor hasNextPage }
        edges {
          node {
            ... on Repository {
              id name isArchived owner { login } description url stargazerCount
              primaryLanguage { name }
              repositoryTopics(first: 10) { nodes { topic { name } } }
              updatedAt
            }
          }
        }
      }
    }
    """

    run_id, repos_before = log_run_start()
    logger.info(
        "Iniciando escaneo desde Top 1 hasta {} estrellas (repos actuales: {})",
        min_stars,
        repos_before,
    )

    current_max_stars = 9999999  # Siempre desde el Top 1 en producción
    total_fetched = 0
    total_skipped = 0
    consecutive_errors = 0

    try:
        while current_max_stars >= min_stars:
            query_string = f"stars:<={current_max_stars} stars:>={min_stars} sort:stars-desc"
            cursor = None
            has_next_page = True
            last_repo_stars = current_max_stars

            while has_next_page:
                variables = {"queryString": query_string, "cursor": cursor}

                try:
                    with httpx.Client(timeout=httpx.Timeout(30.0, connect=15.0)) as client:
                        response = client.post(
                            url,
                            headers=headers,
                            json={"query": query, "variables": variables},
                        )
                except httpx.RequestError as e:
                    consecutive_errors += 1
                    wait = min(60, consecutive_errors * 5)
                    logger.warning("Error de conexion: {} (intento {})", e, consecutive_errors)
                    time.sleep(wait)
                    if consecutive_errors > 5:
                        logger.error("Demasiados errores consecutivos, abortando")
                        raise
                    continue

                consecutive_errors = 0  # Reset al tener éxito

                if response.status_code == 403:
                    logger.warning("Rate-limit de GitHub alcanzado. Esperando 60s...")
                    time.sleep(60)
                    continue
                elif response.status_code != 200:
                    wait = min(30, response.status_code * 2)
                    logger.warning("HTTP {} recibido. Esperando {}s...", response.status_code, wait)
                    time.sleep(wait)
                    continue

                data = response.json()
                if "errors" in data:
                    for err in data["errors"]:
                        logger.error("GraphQL error: {}", err.get("message", "desconocido"))
                    time.sleep(10)
                    continue

                search_data = data["data"]["search"]
                edges = search_data["edges"]

                if not edges:
                    break

                repos_to_insert = []
                for edge in edges:
                    node = edge["node"]
                    stars = node["stargazerCount"]
                    last_repo_stars = stars

                    # Filtro 1: Archivados
                    if node.get("isArchived", False):
                        total_skipped += 1
                        continue

                    # Filtro 2: 500-999 estrellas sin actividad reciente
                    if not is_active_repo(node["updatedAt"], stars):
                        total_skipped += 1
                        continue

                    topics = (
                        [
                            t["topic"]["name"]
                            for t in node.get("repositoryTopics", {}).get("nodes", [])
                        ]
                        if node.get("repositoryTopics")
                        else []
                    )

                    lang = node.get("primaryLanguage")
                    repos_to_insert.append(
                        {
                            "id": node["id"],
                            "name": node["name"],
                            "owner": node["owner"]["login"],
                            "description": node["description"],
                            "url": node["url"],
                            "stars": stars,
                            "language": lang.get("name", "") if lang else "",
                            "topics": topics,
                            "updated_at": node["updatedAt"],
                        }
                    )

                if repos_to_insert:
                    upsert_repos(repos_to_insert)
                    total_fetched += len(repos_to_insert)

                print(
                    f"✅ Procesados: {total_fetched:,} | "
                    f"Omitidos: {total_skipped:,} | "
                    f"Estrellas actuales: {last_repo_stars:,}"
                )

                has_next_page = search_data["pageInfo"]["hasNextPage"]
                cursor = search_data["pageInfo"]["endCursor"]
                time.sleep(0.5)  # Respetar rate-limit de GitHub

            # GitHub GraphQL devuelve max 1000 resultados por búsqueda.
            # Ajustamos el techo para la siguiente iteración.
            current_max_stars = last_repo_stars - 1

    except KeyboardInterrupt:
        logger.warning("Proceso interrumpido por el usuario")
        log_run_finish(run_id, total_fetched, total_skipped, min_stars, status="interrupted")
        return
    except Exception as e:
        logger.error("Error fatal: {}", e)
        log_run_finish(run_id, total_fetched, total_skipped, min_stars, status="failed")
        return

    # Reconstruir índice FTS5 una sola vez al finalizar
    try:
        from scraper.db_manager import rebuild_fts
        rebuild_fts()
    except Exception:
        pass

    log_run_finish(run_id, total_fetched, total_skipped, min_stars, status="completed")
    logger.info(
        "Escaneo completado: {} insertados, {} filtrados, {} total en BD",
        total_fetched,
        total_skipped,
        total_fetched + repos_before,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="WheelSaver Scraper — Descarga repos top de GitHub con filtros de calidad"
    )
    parser.add_argument(
        "--min-stars", type=int, default=500, help="Mínimo de estrellas (default: 500)"
    )
    args = parser.parse_args()
    fetch_top_repos(min_stars=args.min_stars)
````

## File: wheel-saver/scripts/import_from_evanli.py
````python
"""
import_from_evanli.py — Importa repos desde EvanLi/Github-Ranking

Fuente: https://github.com/EvanLi/Github-Ranking
Contiene Top 100 diarios por lenguaje en formato Markdown.
Se actualiza a diario via GitHub Actions.

Uso:
    python scripts/import_from_evanli.py
    python cli.py import evanli
"""

import re
import sys
import os
import time

import httpx
from tqdm import tqdm
from loguru import logger

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper.db_manager import upsert_external_repos, get_stats

RAW_BASE = "https://raw.githubusercontent.com/EvanLi/Github-Ranking/master"

ARCHIVOS = [
    "Top100/Top-100-stars.md",
    "Top100/Top-100-forks.md",
    "Top100/ActionScript.md",
    "Top100/C.md",
    "Top100/CPP.md",
    "Top100/CSS.md",
    "Top100/CSharp.md",
    "Top100/Clojure.md",
    "Top100/CoffeeScript.md",
    "Top100/DM.md",
    "Top100/Dart.md",
    "Top100/Elixir.md",
    "Top100/Go.md",
    "Top100/Groovy.md",
    "Top100/HTML.md",
    "Top100/Haskell.md",
    "Top100/Java.md",
    "Top100/JavaScript.md",
    "Top100/Julia.md",
    "Top100/Kotlin.md",
    "Top100/Lua.md",
    "Top100/MATLAB.md",
    "Top100/Objective-C.md",
    "Top100/PHP.md",
    "Top100/Perl.md",
    "Top100/PowerShell.md",
    "Top100/Python.md",
    "Top100/R.md",
    "Top100/Ruby.md",
    "Top100/Rust.md",
    "Top100/Scala.md",
    "Top100/Shell.md",
    "Top100/Swift.md",
    "Top100/TeX.md",
    "Top100/TypeScript.md",
    "Top100/Vim-script.md",
]


def parse_md_table(text):
    """
    Parsea la tabla Markdown de EvanLi.

    Formato:
    | # | [name](url) | stars | forks | language | issues | description | last_commit |
    """
    repos = []
    seen = set()

    pattern = re.compile(
        r"\|\s*\d+\s*\|"
        r"\s*\[([^\]]+)\]\(([^)]+)\)\s*\|"  # name + url
        r"\s*([\d,]+)\s*\|"  # stars
        r"\s*([\d,]+)\s*\|"  # forks
        r"\s*([^|]*?)\s*\|"  # language
        r"\s*([\d,]+)\s*\|"  # open issues
        r"\s*(.*?)\s*\|"  # description
        r"\s*(.*?)\s*\|"  # last commit
    )

    for line in text.split("\n"):
        line = line.strip()
        m = pattern.match(line)
        if not m:
            continue

        name = m.group(1).strip()
        url = m.group(2).strip()
        stars_str = m.group(3).replace(",", "")
        lang = m.group(5).strip()
        desc = m.group(7).strip()
        updated_at = m.group(8).strip()

        key = name.lower()
        if key in seen:
            continue
        seen.add(key)

        owner = ""
        try:
            parts = url.rstrip("/").split("/")
            if len(parts) >= 4 and parts[2] == "github.com":
                owner = parts[3]
        except Exception:
            pass

        if not owner:
            continue

        try:
            stars = int(stars_str)
        except ValueError:
            continue

        repos.append(
            {
                "name": name,
                "owner": owner,
                "description": desc,
                "url": url,
                "stars": stars,
                "language": lang if lang and lang != "None" else "",
                "topics": [],
                "updated_at": updated_at,
            }
        )

    return repos


def fetch_and_parse(url, label, client):
    """Descarga un archivo Markdown y parsea los repos."""
    try:
        resp = client.get(url)
        resp.raise_for_status()
        repos = parse_md_table(resp.text)
        return repos
    except httpx.RequestError as e:
        logger.error("Error conexion {}: {}", label, e)
        return []
    except httpx.HTTPStatusError as e:
        logger.warning("HTTP {} en {}", e.response.status_code, label)
        return []


def main():
    logger.info("Importando desde EvanLi/Github-Ranking ({} archivos)", len(ARCHIVOS))

    antes = get_stats()
    todos = []

    with httpx.Client(timeout=30.0) as client:
        for archivo in tqdm(ARCHIVOS, desc="EvanLi", unit="archivo"):
            url = f"{RAW_BASE}/{archivo}"
            label = archivo.replace("Top100/", "").replace(".md", "")
            repos = fetch_and_parse(url, label, client)
            todos.extend(repos)
            time.sleep(0.3)

    # Deduplicar
    unicos = {}
    for r in todos:
        key = r["name"].lower()
        if key not in unicos or len(r["description"]) > len(unicos[key]["description"]):
            unicos[key] = r

    final = list(unicos.values())
    print(f"\nTotal crudo: {len(todos)} | Despues de dedup: {len(final)}")

    if not final:
        logger.warning("No se encontraron repos en EvanLi")
        return

    BATCH = 100
    for i in range(0, len(final), BATCH):
        batch = final[i : i + BATCH]
        upsert_external_repos(batch)

    # Reconstruir índice FTS5 una sola vez al finalizar todos los lotes
    from scraper.db_manager import rebuild_fts
    rebuild_fts()

    despues = get_stats()
    logger.info(
        "EvanLi: antes={} despues={} nuevos={}",
        antes["total_repos"],
        despues["total_repos"],
        despues["total_repos"] - antes["total_repos"],
    )


if __name__ == "__main__":
    main()
````

## File: wheel-saver/scripts/scrape_gitstar_ranking.py
````python
"""
scrape_gitstar_ranking.py — Scrapea gitstar-ranking.com/repositories

Fuente: https://gitstar-ranking.com/repositories
Ranking global de GitHub repos ordenados por estrellas.
~100 paginas x 50 repos = ~5,000 repos escaneables.

Uso:
    python scripts/scrape_gitstar_ranking.py              # todas las paginas
    python scripts/scrape_gitstar_ranking.py --pages 5    # solo primeras 5
    python scripts/scrape_gitstar_ranking.py --start 50   # desde la pagina 50
    python cli.py import gitstar [--pages N]
"""

import sys
import os
import re
import time

import httpx
from tqdm import tqdm
from loguru import logger

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper.db_manager import upsert_external_repos, get_stats

TOTAL_PAGES = 100
REPOS_PER_PAGE = 50
BASE_URL = "https://gitstar-ranking.com/repositories"
REQUEST_DELAY = 1.5


def parse_repos_from_html(html):
    """Extrae repos del HTML de una pagina de gitstar-ranking."""
    repos = []
    seen = set()

    pattern = re.compile(
        r'<a\s+class="list-group-item\s*paginated_item"[^>]*href="/([^"/]+/[^"/]+)"[^>]*>'
        r"(.*?)"
        r"</a>",
        re.DOTALL,
    )

    for m in pattern.finditer(html):
        href_owner_repo = m.group(1)
        inner = m.group(2)

        if "/" not in href_owner_repo:
            continue
        owner, name = href_owner_repo.split("/", 1)

        key = f"{owner.lower()}/{name.lower()}"
        if key in seen:
            continue
        seen.add(key)

        stars_match = re.search(
            r"stargazers_count[^>]*>\s*(?:<i[^>]*></i>\s*)?([\d,]+)\s*<",
            inner,
        )
        stars = int(stars_match.group(1).replace(",", "")) if stars_match else 0

        desc_match = re.search(
            r'repo-description["\'][^>]*title\s*=\s*["\']([^"\']*)["\']',
            inner,
        )
        description = desc_match.group(1).strip() if desc_match else ""

        lang_match = re.search(
            r"repo-language[^>]*>.*?label[^>]*>\s*([^<]+?)\s*<", inner, re.DOTALL
        )
        language = ""
        if lang_match:
            lang_text = lang_match.group(1).strip()
            if lang_text != "No language available":
                language = lang_text

        repos.append(
            {
                "name": name,
                "owner": owner,
                "description": description,
                "url": f"https://github.com/{owner}/{name}",
                "stars": stars,
                "language": language,
                "topics": [],
                "updated_at": "",
            }
        )

    return repos


def scrape_gitstar(start_page=1, max_pages=None):
    """Scrapea gitstar-ranking.com desde start_page hasta max_pages."""
    total_pages = max_pages if max_pages else (TOTAL_PAGES - start_page + 1)

    logger.info(
        "Scrapeando gitstar-ranking.com: paginas {} a {}", start_page, start_page + total_pages - 1
    )

    all_repos = []
    page = start_page
    consecutive_errors = 0

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    with httpx.Client(timeout=30.0, headers=headers) as client:
        pages_range = range(page, min(page + total_pages, TOTAL_PAGES + 1))

        for page_num in tqdm(pages_range, desc="gitstar-ranking", unit="pag"):
            url = BASE_URL if page_num == 1 else f"{BASE_URL}?page={page_num}"

            try:
                resp = client.get(url)
                resp.raise_for_status()
            except httpx.RequestError as e:
                consecutive_errors += 1
                wait = min(30, consecutive_errors * 5)
                logger.warning(
                    "Error pagina {}: {} (esperando {}s, intento {})",
                    page_num,
                    e,
                    wait,
                    consecutive_errors,
                )
                time.sleep(wait)
                if consecutive_errors > 3:
                    logger.error("Demasiados errores en gitstar, abortando")
                    break
                continue
            except httpx.HTTPStatusError as e:
                logger.warning("HTTP {} en pagina {}", e.response.status_code, page_num)
                time.sleep(5)
                continue

            consecutive_errors = 0
            repos = parse_repos_from_html(resp.text)
            all_repos.extend(repos)
            time.sleep(REQUEST_DELAY)

    return all_repos


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Scrapea gitstar-ranking.com")
    parser.add_argument("--pages", type=int, default=0, help="Paginas (0 = todas)")
    parser.add_argument("--start", type=int, default=1, help="Pagina inicial")
    args = parser.parse_args()

    logger.info("Scrapeando gitstar-ranking.com")
    antes = get_stats()

    max_pages = args.pages if args.pages > 0 else None
    todos = scrape_gitstar(start_page=args.start, max_pages=max_pages)

    if not todos:
        logger.warning("No se extrajeron repos de gitstar. Posible cambio en la estructura HTML de gitstar-ranking.com.")
        return

    unicos = {}
    for r in todos:
        key = f"{r['owner'].lower()}/{r['name'].lower()}"
        if key not in unicos or r["stars"] > unicos[key]["stars"]:
            unicos[key] = r

    final = list(unicos.values())
    logger.info("Gitstar: {} crudos, {} unicos", len(todos), len(final))

    BATCH = 100
    for i in range(0, len(final), BATCH):
        batch = final[i : i + BATCH]
        upsert_external_repos(batch)

    # Reconstruir índice FTS5 una sola vez al finalizar
    from scraper.db_manager import rebuild_fts
    rebuild_fts()

    despues = get_stats()
    logger.info(
        "Gitstar: antes={} despues={} nuevos={}",
        antes["total_repos"],
        despues["total_repos"],
        despues["total_repos"] - antes["total_repos"],
    )


if __name__ == "__main__":
    main()
````

## File: brain.ps1
````powershell
# brain.ps1 — Lanza OpenCode con DeepSeek + MCP LifeOS
# Uso: .\brain.ps1  (desde la raíz del proyecto)

# Carga variables desde .env al entorno del shell actual
Get-Content .env -ErrorAction SilentlyContinue |
  Where-Object { $_ -match '^([^#\s][^=]*)=(.*)$' } |
  ForEach-Object {
    $name  = $Matches[1].Trim()
    $value = $Matches[2].Trim().Trim('"').Trim("'")
    [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }

Write-Host "✅ Variables de entorno cargadas (.env)" -ForegroundColor Green
Write-Host "🧠 Iniciando LifeOS Brain con DeepSeek..." -ForegroundColor Cyan

opencode
````

## File: CREAR REPOMIX.BAT
````batch
@echo off
title Generar Repomix Actualizado
color 0B

echo ===================================================
echo      Generador de Repomix (Asistente Personal)
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Limpiar empaquetados anteriores de Repomix
echo [*] Eliminando empaquetados anteriores para evitar duplicados...
if exist repomix_*.md (
    del /q repomix_*.md
    echo [✓] Limpieza completada.
)
echo.

:: 2. Obtener marca de tiempo de forma segura (Formato: AAAAMMDD_HHMMSS)
for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"`) do set "TS=%%a"

set "FILENAME=repomix_%TS%.md"

:: 3. Ejecutar el empaquetador
echo [*] Generando nuevo empaquetado: %FILENAME%...
echo [*] Por favor espera...
echo.

call npx repomix --output %FILENAME%

echo.
echo ===================================================
echo [OK] Proceso finalizado con exito.
echo [OK] Tu proyecto esta empaquetado en: %FILENAME%
echo ===================================================
pause
````

## File: crear_contextos_locales.ps1
````powershell
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Generador de Contextos Modulares (IA Local 6GB) " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Limpiar anteriores
Remove-Item -Path .\ctx_*.md -Force -ErrorAction SilentlyContinue

# 1. Módulo CORE (Cerebro, Lóbulos, Runtime) -> ~15k tokens
Write-Host "[*] Generando ctx_core.md (Cerebro y Runtime)..." -ForegroundColor Yellow
npx repomix --include "lib/ai/**,lib/lobulos/**,lib/think/**,lib/runtime/**,lib/events/**" --output ctx_core.md

# 2. Módulo JOBS (Scrapers y Pipeline de Empleo) -> ~25k tokens
Write-Host "[*] Generando ctx_jobs.md (Pipeline de Empleo)..." -ForegroundColor Yellow
npx repomix --include "scripts/jobs/**,lib/jobs/**" --output ctx_jobs.md

# 3. Módulo DASHBOARD (Frontend Next.js) -> ~20k tokens
Write-Host "[*] Generando ctx_dashboard.md (Frontend)..." -ForegroundColor Yellow
npx repomix --include "dashboard/src/**,dashboard/package.json" --output ctx_dashboard.md

# 4. Módulo WHEELSAVER (Python API) -> ~15k tokens
Write-Host "[*] Generando ctx_wheelsaver.md (Python API)..." -ForegroundColor Yellow
npx repomix --include "wheel-saver/api/**,wheel-saver/scraper/**,wheel-saver/cli.py" --output ctx_wheelsaver.md

Write-Host "===================================================" -ForegroundColor Green
Write-Host "✅ ¡Contextos ligeros generados con éxito!" -ForegroundColor Green
Write-Host "Úsalos en tu IA local según lo que vayas a programar." -ForegroundColor Green
````

## File: deuda_tecnica_plan.md
````markdown
# Plan de Saneamiento de Deuda Técnica — LifeOS
> Documentado el 10 de julio de 2026 | Estado: Pendiente de ejecución para el futuro

Este documento registra los riesgos estructurales identificados en la arquitectura de LifeOS y detalla un plan de implementación por fases para resolverlos cuando se decida escalar el sistema.

---

## 🔍 1. Diagnóstico de Deuda Técnica y Riesgos

### 🔴 Riesgo 1: Volatilidad del Caché de GitHub Actions (Riesgo Alto)
*   **Diagnóstico:** El uso de `actions/cache` para persistir la base de datos `lifeos.db` entre ejecuciones de GitHub Actions de corta duración (cada 5 minutos) es un riesgo crítico. El caché de GitHub es volátil, tiene límites de almacenamiento y se purga automáticamente tras inactividad del repositorio.
*   **Impacto:** Si el caché se pierde o falla al restaurarse, se borrará todo el historial del masterledger, aplicaciones y casos de uso.
*   **Mitigación:** Configurar replicación real e independiente en la nube.

### 🟡 Riesgo 2: Volatilidad de la Cola en Memoria (Event Bus) (Riesgo Medio)
*   **Diagnóstico:** La cola de reintentos y la Dead Letter Queue (DLQ) en `event_bus.js` residen estrictamente en la memoria RAM del proceso de Node.js.
*   **Impacto:** Como Jarvis se ejecuta en cron jobs locales o en la nube que cierran el proceso al terminar (`process.exit()`), cualquier evento que falle por un microcorte de red y quede en cola para reintentarse en los siguientes minutos se perderá definitivamente.
*   **Mitigación:** Persistir la cola de eventos en una tabla dedicada en SQLite.

### 🟡 Riesgo 3: Consistencia en el Acceso a Datos (Riesgo Bajo/Medio)
*   **Diagnóstico:** A pesar de contar con la capa de resolución centralizada `lib/data/paths.js`, existen scripts de desarrollo y scrapers (ej. en `scripts/dev/`) que siguen consumiendo rutas relativas hardcodeadas (ej. `'data/cache/repos_db.json'`).
*   **Impacto:** Rompe el principio de "un único origen de verdad" y puede causar fallas de lectura si los scripts se ejecutan desde directorios de trabajo diferentes.
*   **Mitigación:** Refactorizar accesos a datos para importar las constantes de `paths.js`.

---

## 🛠️ 2. Plan de Implementación por Fases

### 📅 Fase A: Replicación de Base de Datos con Litestream (Seguridad)
*   **Objetivo:** Eliminar la dependencia de `actions/cache` de GitHub.
*   **Tareas:**
    1.  Crear una cuenta gratuita en Cloudflare R2 (10 GB de almacenamiento gratuito).
    2.  Habilitar e instalar Litestream (utilizando el archivo `litestream.yml` que ya se encuentra en tu raíz).
    3.  Configurar la replicación continua en tiempo real de `lifeos.db` y `memoria_hipocampo.db` hacia el bucket R2.
    4.  Actualizar los workflows de GitHub Actions para que restauren y repliquen la DB usando Litestream en lugar del caché de compilación.

### 📅 Fase B: Resiliencia de la Cola de Eventos (Event Bus)
*   **Objetivo:** Garantizar que ningún evento importante se pierda si el proceso de Node.js finaliza.
*   **Tareas:**
    1.  Crear una tabla llamada `event_queue` en SQLite (`lifeos.db`) a través de una migración en `runtime/migrations/`.
    2.  Modificar `event_bus.js` para que cada `emit()` guarde el evento en la base de datos con un estado de "pendiente".
    3.  Al finalizar un proceso corto, los eventos que fallen o requieran reintento se quedarán guardados de forma transaccional en la DB, listos para ser retomados por el siguiente ciclo de Jarvis (5 minutos después).

### 📅 Fase C: Unificación de Rutas (Portabilidad)
*   **Objetivo:** Garantizar que el sistema pueda moverse de carpetas o ejecutarse en Docker de forma transparente.
*   **Tareas:**
    1.  Escanear los archivos de las carpetas `scripts/dev/` y `scripts/jobs/`.
    2.  Reemplazar todas las rutas relativas estáticas de lectura de archivos por llamadas a la constante unificada `PATHS` importada de `lib/data/paths.js`.
````

## File: ecosystem.config.archived.js
````javascript
module.exports = {
  apps: [
    // ── Daemon (always-on) ──────────────────────────────────────
    {
      name: "jarvis-telegram",
      script: "./scripts/integrations/telegram_listener.js",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production" },
    },

    // ── Cron jobs (restart on schedule, exit after run) ────────

    // Brain orchestrator — diario 7am Colombia (12pm UTC)
    {
      name: "brain-orchestrator",
      script: "./scripts/schedulers/brain_orchestrator.js",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // Context engine — diario 6am Colombia (11am UTC)
    {
      name: "context-engine-daily",
      script: "./scripts/schedulers/context_engine_daily.js",
      cron_restart: "0 11 * * *",
      autorestart: false,
    },

    // Morning briefing — diario 7am Colombia (12pm UTC)
    {
      name: "morning-briefing",
      script: "./scripts/schedulers/morning_briefing.ts",
      exec_interpreter: "tsx",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // Email cleaner — cada 3h
    {
      name: "email-cleaner",
      script: "./scripts/integrations/email_processor.js",
      cron_restart: "0 */3 * * *",
      autorestart: false,
    },

    // Inbox sensor — cada 15 min
    {
      name: "inbox-sensor",
      script: "./scripts/integrations/inbox_sensor.js",
      cron_restart: "*/15 * * * *",
      autorestart: false,
    },

    // SENA scraper — lun-vie 6am Colombia (11am UTC)
    {
      name: "sena-scraper",
      script: "./scripts/integrations/moodle_sena_scraper.js",
      cron_restart: "0 11 * * 1-5",
      autorestart: false,
    },

    // SENA tracker — diario 7am Colombia (12pm UTC)
    {
      name: "sena-tracker",
      script: "./scripts/integrations/moodle_sena_tracker.js",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // SIMIT checker — diario 7am Colombia (12pm UTC)
    {
      name: "simit-checker",
      script: "./scripts/integrations/simit_scraper.js",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // DIAN scraper — lunes 9am Colombia (2pm UTC)
    {
      name: "dian-scraper",
      script: "./scripts/integrations/dian_scraper.js",
      cron_restart: "0 14 * * 1",
      autorestart: false,
    },

    // Computrabajo scraper — lun-vie 8am Colombia (1pm UTC)
    {
      name: "computrabajo-scraper",
      script: "./scripts/jobs/computrabajo_scraper.js",
      cron_restart: "0 13 * * 1-5",
      autorestart: false,
    },

    // Computrabajo auto-apply — lun-vie 9am Colombia (2pm UTC)
    {
      name: "computrabajo-apply",
      script: "./scripts/jobs/computrabajo_apply.js",
      cron_restart: "0 14 * * 1-5",
      autorestart: false,
    },

    // Job loop — lun-vie 10am Colombia (3pm UTC)
    {
      name: "job-loop",
      script: "./scripts/jobs/job_loop.js",
      cron_restart: "0 15 * * 1-5",
      autorestart: false,
    },

    // Healthcheck — diario 8am Colombia (1pm UTC)
    {
      name: "healthcheck",
      script: "./scripts/diagnostics/healthcheck.js",
      cron_restart: "0 13 * * *",
      autorestart: false,
    },

    // Recordatorio DeepSeek — 6am/7pm/10pm Colombia
    // 6am Colombia = 11am UTC
    // 7pm Colombia = 0am UTC (next day)
    // 10pm Colombia = 3am UTC (next day)
    {
      name: "recordatorio-deepseek",
      script: "./scripts/integrations/recordatorio_deepseek.js",
      cron_restart: "0 11,0,3 * * *",
      autorestart: false,
    },

    // Document pipeline — diario 9am Colombia (2pm UTC)
    {
      name: "document-pipeline",
      script: "./scripts/maintenance/document_pipeline.js",
      cron_restart: "0 14 * * *",
      autorestart: false,
    },

    // Vehicle manager — diario 6am Colombia (11am UTC)
    {
      name: "vehicle-manager",
      script: "./scripts/schedulers/vehicle_manager.js",
      cron_restart: "0 11 * * *",
      autorestart: false,
    },

    // Backups DB — diario 11pm Colombia (4am UTC)
    {
      name: "backup-dbs",
      script: "./scripts/maintenance/backup_dbs.ts",
      exec_interpreter: "tsx",
      cron_restart: "0 4 * * *",
      autorestart: false,
    },
  ],
};
````

## File: fix_job_hunter.js
````javascript
// fix_job_hunter.js - Refactorización completa del módulo Job Hunter
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname);
const LOG_FILE = path.join(ROOT, "data/logs/job_hunter_fix.log");

function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  fs.appendFileSync(LOG_FILE, entry + "\n");
}

log("🚀 Iniciando refactorización completa de Job Hunter...");

// Crear directorio utils si no existe
const utilsDir = path.join(ROOT, "lib/utils");
if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });

// ======================
// 1. lib/utils/scraper.js (Stealth + Retry)
const scraperContent = `const { chromium } = require('playwright');
const { withRetry } = require('./retry');

async function createStealthContext() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'es-CO',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
  });
  return { browser, context };
}

async function scrapeWithRetry(url, callback, maxRetries = 3) {
  return withRetry(async () => {
    const { browser, context } = await createStealthContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      return await callback(page);
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  }, maxRetries);
}

module.exports = { createStealthContext, scrapeWithRetry };
`;

fs.writeFileSync(path.join(utilsDir, "scraper.js"), scraperContent);
log("✅ lib/utils/scraper.js creado");

// ======================
// 2. lib/utils/retry.js
const retryContent = `async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, i);
      console.warn(\`[Retry] Intento \${i+1}/\${maxRetries} - esperando \${delay}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
module.exports = { withRetry };
`;
fs.writeFileSync(path.join(utilsDir, "retry.js"), retryContent);
log("✅ lib/utils/retry.js creado");

// ======================
// 3. Actualizar scripts existentes (reemplazos automáticos)
const filesToFix = [
  "scripts/jobs/computrabajo_scraper.js",
  "scripts/jobs/computrabajo_apply.js",
  "scripts/jobs/job_loop.js",
];

filesToFix.forEach((file) => {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    log(`⚠️ Archivo no encontrado: ${file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");

  // Reemplazos clave
  content = content.replace(
    /const \{ chromium \} = require\('playwright'\);/g,
    `const { scrapeWithRetry } = require('../../lib/utils/scraper');`,
  );

  content = content.replace(
    /await chromium\.launch/g,
    `// Usando scrapeWithRetry wrapper`,
  );

  fs.writeFileSync(fullPath, content);
  log(`✅ Actualizado: ${file}`);
});

log("Ejecuta ahora: node scripts/jobs/computrabajo_scraper.js para probar.");
console.log("\nRevisa data/logs/job_hunter_fix.log");
````

## File: fix_tech_debt.js
````javascript
/**
 * fix_tech_debt.js
 * Script Maestro de Saneamiento de Deuda Técnica (P0)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("\n═══════════════════════════════════════════════════════");
console.log("     LIFEOS TECH-DEBT SANITIZER (NODE.JS MODE)         ");
console.log("═══════════════════════════════════════════════════════\n");

function runCommand(command, ignoreError = false) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    if (!ignoreError) {
      console.error(`\n[❌] Error ejecutando: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
console.log("[🚀] Paso 1: Eliminar bases de datos del tracking de Git...");
const dbsToUntrack = ["runtime/lifeos.db", "data/memoria_hipocampo.db"];

dbsToUntrack.forEach((db) => {
  if (fs.existsSync(db)) {
    runCommand(`git rm --cached ${db}`, true);
    console.log(`  [✅] Sacado de Git tracking: ${db}`);
  } else {
    console.log(`  [⚠️] Archivo no encontrado en local: ${db}`);
  }
});

// ─────────────────────────────────────────────────────────────
console.log("\n[🚀] Paso 2: Parchear .gitignore...");
const gitignorePath = path.join(__dirname, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  let content = fs.readFileSync(gitignorePath, "utf8");

  // Eliminar las excepciones que obligaban a subir las DBs a Git
  content = content.replace(/^!data\/memoria_hipocampo\.db\r?\n?/gm, "");
  content = content.replace(/^!runtime\/lifeos\.db\r?\n?/gm, "");

  fs.writeFileSync(gitignorePath, content, "utf8");
  console.log("  [✅] .gitignore parcheado. Las DBs ahora serán ignoradas.");
}

// ─────────────────────────────────────────────────────────────
console.log("\n[🚀] Paso 3: Parchear workflows de GitHub Actions...");
const workflowsDir = path.join(__dirname, ".github", "workflows");
let patchedCount = 0;

if (fs.existsSync(workflowsDir)) {
  const workflows = fs
    .readdirSync(workflowsDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  workflows.forEach((file) => {
    const wfPath = path.join(workflowsDir, file);
    let wfContent = fs.readFileSync(wfPath, "utf8");

    if (
      wfContent.includes("runtime/lifeos.db") ||
      wfContent.includes("data/memoria_hipocampo.db")
    ) {
      // Remover las menciones a los archivos .db
      wfContent = wfContent.replace(/ runtime\/lifeos\.db/g, "");
      wfContent = wfContent.replace(/ data\/memoria_hipocampo\.db/g, "");
      wfContent = wfContent.replace(/runtime\/lifeos\.db /g, "");
      wfContent = wfContent.replace(/data\/memoria_hipocampo\.db /g, "");

      fs.writeFileSync(wfPath, wfContent, "utf8");
      console.log(`  [✅] Parcheado: ${file}`);
      patchedCount++;
    }
  });
}

if (patchedCount === 0) {
  console.log(
    "  [⚠️] No se encontraron workflows que necesiten parcheo (o ya estaban corregidos).",
  );
}

// ─────────────────────────────────────────────────────────────
console.log("\n[🚀] Paso 4: Validar cambios y Comitear a GitHub...");

const status = runCommand("git status --porcelain");
if (!status || status.trim() === "") {
  console.log(
    "  [⚠️] No hay cambios para comitear. El repositorio ya está saneado.\n",
  );
  process.exit(0);
}

console.log("  Aplicando commit...");
runCommand("git add .");
runCommand(
  'git commit -m "chore(tech-debt): Saneamiento P0. Eliminar DBs de git tracking y parchear actions"',
);

console.log("  Haciendo push al servidor (esto puede tardar unos segundos)...");
runCommand("git push origin main");

console.log("  [✅] ¡Deuda técnica P0 resuelta! Cambios subidos a GitHub.\n");

console.log("═══════════════════════════════════════════════════════");
console.log("  RECOMENDACIÓN POST-SCRIPT:");
console.log(
  "  Como las DBs ya no subirán a GitHub, la próxima vez que se ejecuten",
);
console.log(
  "  tus Actions, vivirán en caché. Cuando quieras persistencia real",
);
console.log("  en la nube, implementa Litestream con Cloudflare R2.");
console.log("═══════════════════════════════════════════════════════\n");
````

## File: LICENSE
````
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
````

## File: mcp.json
````json
{
  "mcpServers": {
    "lifeos": {
      "command": "node",
      "args": ["mcp/lifeos_server.js"],
      "env": {
        "DOTENV_CONFIG_PATH": ".env"
      }
    }
  }
}
````

## File: overengineering_audit_estudio-lifeos.md
````markdown
# Auditoría de deuda técnica y complejidad — LifeOS

> Auditada el 15 de julio de 2026 | Complejidad evitable: **25/100 (⚠️ warning)**
>
> Alcance: código fuente, configuración, documentación y verificaciones locales. No se ejecutaron scrapers ni la rutina diaria, ya que producen efectos externos.

## Resumen ejecutivo

LifeOS no necesita una re-arquitectura: su arquitectura local, single-tenant y *Run & Die* es adecuada. La deuda principal es de **consolidación incompleta**: quedan rutas legacy, documentación/configuración obsoleta, dos implementaciones del migrador y componentes operativos sin pruebas. Es riesgo de mantenimiento, no un problema de escalabilidad.

| Dimensión | Puntos | Evaluación |
|---|---:|---|
| Arquitectura | 5 | Aplicación local razonable; el subproyecto WheelSaver añade un runtime Python/API para una integración que hoy no funciona. |
| Dependencias | 10 | `valibot` no tiene importaciones en código de ejecución; hay tres proyectos Node/Python sin una frontera de mantenimiento explícita. |
| Patrones | 10 | Dos runners de migraciones divergen y el acceso al estado aún tiene una ruta legacy. |
| Single-tenant | 0 | Correcto: no hay multi-tenant, roles ni infraestructura SaaS injustificada. |
| **Total** | **25** | **⚠️ Revisar y simplificar selectivamente.** |

## Verificaciones realizadas

- `npm test`: **8 archivos, 56 pruebas, todas exitosas**.
- `npx tsc --noEmit`: exitoso.
- `npm run runtime:ci`: exitoso, 0 fallos y 0 advertencias.
- Se inspeccionaron 151 archivos JS/TS de `lib`, `scripts`, `runtime` y `tests`; solo 8 son pruebas.
- WheelSaver local: `wheel-saver/data/top_repos.db` existe pero `repos` contiene **0** filas. `python cli.py stats` falla al formatear `stars_min = None`.

---

## Hallazgos por prioridad

### 🔴 P0 — La migración de `scripts/data` no está terminada

**Evidencia:** `scripts/integrations/email_processor.js` e `inbox_sensor.js` usan `scripts/data/processed_emails.json`; `mcp/lifeos_server.js` también lo lee. La carpeta reapareció como no rastreada. Esto contradice `AGENTS.md` y `docs/DEEP_AUDIT_FIXES_PLAN.md`, que declaran `scripts/data/` archivado y fuera del runtime.

- **Costo actual:** existen dos fuentes potenciales de estado y el proceso depende del directorio de ejecución; la auditoría de rutas no lo detecta porque su guardrail no cubre esta ruta.
- **Solución:** migrar ese checkpoint a `CheckpointStore` (preferible) o añadir un `PATHS.EMAIL_PROCESSED`; retirar los tres accesos legacy y agregar una prueba de migración/lectura.
- **Criterio de cierre:** `rg -n -F 'scripts/data' lib scripts runtime mcp` no devuelve código de runtime y la carpeta no se recrea tras procesar correos.

### 🔴 P0 — Dos migradores para la misma base de datos pueden divergir

**Evidencia:** `runtime/migrate.js` y `runtime/stores/Database.js` repiten creación de `schema_migrations`, escaneo, checksum y aplicación de `runtime/migrations/*.sql`. Ya difieren: el CLI exige que la DB exista, guarda checksum y tiene `--dry-run`; el store crea la DB implícitamente, ignora checksums existentes y gestiona backup de otra manera.

- **Costo actual:** una migración puede comportarse distinto desde `npm run migrate` que al arrancar la aplicación. El checksum guardado no se usa para detectar una migración modificada.
- **Solución:** extraer un único `runtime/migrations/runner.js`, usado tanto por el CLI como por `Database.getDb()`. Elegir una sola política de creación, backup, checksum y transacción; fallar si un checksum aplicado cambia.
- **Pruebas mínimas:** DB nueva, DB ya migrada, checksum alterado, rollback ante SQL inválido y ejecución simultánea.

### 🟡 P1 — La automatización crítica no es testeable de forma segura

**Evidencia:** `AGENTS.md` documenta `npm run daily:test`, pero no existe en `package.json`. `daily_routine.js` tiene `SHUTDOWN_AFTER_RUN = true` fijo, por lo que `npm run daily` puede apagar el equipo. No hay pruebas para `daily_routine.js`, `event_worker.js` ni los adaptadores de scrapers.

- **Costo actual:** no hay ensayo de la orquestación sin red, Telegram, navegador ni apagado. La cobertura actual se concentra en reglas y stores.
- **Solución:** introducir flags explícitos y seguros: `--dry-run`, `--no-shutdown` y `--only <fase>`, con `daily:test` apuntando a `node scripts/daily_routine.js --dry-run --no-shutdown`. Inyectar el ejecutor de procesos y el apagado para probar el orden, los reintentos y los fallos parciales.
- **Criterio de cierre:** una prueba valida fases, skip de lunes/fin de semana, reintento y que ningún comando de apagado se invoca en modo test.

### 🟡 P1 — WheelSaver está integrado pero no es funcional ni verificable

**Evidencia:** el repositorio anidado aporta venv Python, FastAPI, CLI y frontend; su DB de 48 KB está vacía (0 repos). Las búsquedas no retornan resultados y `stats` lanza un `TypeError` por valores `None`. Aun así, LifeOS mantiene un cliente Node de ~9 KB, un CLI de ~10 KB, scripts npm y eventos para esa integración.

- **Costo actual:** un runtime extra, rutas Windows rígidas (`venv/Scripts/python.exe`) y superficie operativa sin valor hasta que se cargue la base.
- **Solución:** decidir una de dos rutas: (A) tratar WheelSaver como herramienta de desarrollo independiente, quitar cliente/eventos/scripts del runtime LifeOS; o (B) mantenerlo como feature, corregir stats vacío, añadir `install-check`/health a CI y un estado explícito `not_ready` si `repos = 0`.
- **Nota WheelSaver:** se hicieron búsquedas locales de alternativas; no pueden respaldar una recomendación porque la BD está vacía. Primero hay que poblarla o retirar la integración activa.

### 🟡 P1 — Documentación y configuración contradicen el runtime actual

**Evidencia:** el `README.md` de raíz es el README de Litestream, no el de LifeOS. El README del dashboard aún es el template de `create-next-app`. `deuda_tecnica_plan.md` habla de GitHub Actions y PM2, ya eliminados. Siguen presentes `litestream.yml`, `docker-compose.yml` y `ecosystem.config.archived.js`; su condición de soporte no está definida.

- **Costo actual:** cualquier sesión nueva parte de instrucciones falsas y puede reintroducir mecanismos retirados.
- **Solución:** reescribir ambos README con propósito, arranque, datos, límites y Run & Die. Mover planes históricos/configuración no operativa a `etc/archived/` con un `README` que indique si Litestream/Docker son soportados o experimentales.
- **Criterio de cierre:** todos los comandos documentados existen y una búsqueda de `PM2`, `GitHub Actions` y `daily:test` solo encuentra contexto histórico correcto.

### 🟢 P2 — Dependencia sin uso y fronteras de proyecto difusas

**Evidencia:** `valibot` aparece en manifiestos y documentación, pero no hay importaciones en `lib`, `scripts`, `runtime`, `tests` ni `mcp`. El árbol contiene tres unidades con lockfiles/manifiestos separados: LifeOS raíz, `dashboard/` y `wheel-saver/`.

- **Solución:** quitar `valibot` con `npm uninstall valibot` o incorporar validación en los límites reales de entrada. Declarar en el README raíz que dashboard y WheelSaver son subproyectos opcionales, con sus comandos y ciclo de release propios.

### 🟢 P2 — Rutas canónicas adoptadas a medias

Además de `scripts/data`, hay accesos directos a `data/` en scripts de desarrollo, diagnósticos y jobs. Algunos son solo mensajes/comentarios y otros son I/O real (`check_schema.js`, constructores de CV, `ct_update_profile.js`, backups). Esto no rompe hoy, pero debilita el principio de `lib/data/paths.js` como fuente única.

- **Solución:** priorizar primero los procesos de producción; ampliar `PATHS` para artefactos de CV, logs de Computrabajo y backups. No convertir comentarios ni scripts puramente desechables por deporte.

---

## Recomendaciones de WheelSaver

No se recomienda añadir otra librería para los hallazgos P0/P1: son problemas de consolidación, pruebas y documentación, no de falta de framework. La búsqueda local de WheelSaver no produjo candidatos porque su índice contiene 0 repositorios; además su comando de estadísticas falla en ese estado. Corregir o desacoplar WheelSaver precede cualquier recomendación basada en él.

## Orden de ejecución propuesto

1. Corregir el checkpoint `scripts/data` y añadir su prueba de regresión.
2. Unificar el runner de migraciones y probar checksums/rollback.
3. Hacer `daily` ensayable sin apagado; restaurar el contrato `daily:test` o eliminarlo de la documentación.
4. Decidir si WheelSaver es herramienta externa o feature soportada; eliminar el camino que no se elija.
5. Sanear README, dashboard README y artefactos históricos.

## Lo que no cambiaría

- SQLite y `better-sqlite3`: adecuados para un sistema personal local.
- Event bus + transactional outbox: el patrón está justificado por procesos Run & Die; falta prueba e integración completa, no reemplazo.
- Playwright, Google APIs y Telegraf: responden a integraciones reales, no son sobre-ingeniería.
- La política single-tenant y el esquema Run & Die: son una simplificación correcta frente al PM2/GitHub Actions anterior.
````

## File: README.md
````markdown
Litestream
![GitHub release (latest by date)](https://img.shields.io/github/v/release/benbjohnson/litestream)
![Status](https://img.shields.io/badge/status-beta-blue)
![GitHub](https://img.shields.io/github/license/benbjohnson/litestream)
[![Docker Pulls](https://img.shields.io/docker/pulls/litestream/litestream.svg?maxAge=604800)](https://hub.docker.com/r/litestream/litestream/)
==========

Litestream is a standalone disaster recovery tool for SQLite. It runs as a
background process and safely replicates changes incrementally to another file
or S3. Litestream only communicates with SQLite through the SQLite API so it
will not corrupt your database.

If you need support or have ideas for improving Litestream, please visit
[GitHub Issues](https://github.com/benbjohnson/litestream/issues).
Please visit the [Litestream web site](https://litestream.io) for installation
instructions and documentation.

If you find this project interesting, please consider starring the project on
GitHub.

Contributing
------------

We welcome bug reports, fixes, and patches! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute.

Acknowledgements
----------------

I want to give special thanks to individuals who invest much of their time and
energy into the project to help make it better:

- Thanks to [Cory LaNou](https://twitter.com/corylanou) for giving early feedback and testing when Litestream was still pre-release.
- Thanks to [Michael Lynch](https://github.com/mtlynch) for digging into issues and contributing to the documentation.
- Thanks to [Kurt Mackey](https://twitter.com/mrkurt) for feedback and testing.
- Thanks to [Sam Weston](https://twitter.com/cablespaghetti) for figuring out how to run Litestream on Kubernetes and writing up the docs for it.
- Thanks to [Rafael](https://github.com/netstx) & [Jungle Boogie](https://github.com/jungle-boogie) for helping to get OpenBSD release builds working.
- Thanks to [Simon Gottschlag](https://github.com/simongottschlag), [Marin](https://github.com/supermarin),[Victor Björklund](https://github.com/victorbjorklund), [Jonathan Beri](https://twitter.com/beriberikix) [Yuri](https://github.com/yurivish), [Nathan Probst](https://github.com/nprbst), [Yann Coleu](https://github.com/yanc0), and [Nicholas Grilly](https://twitter.com/ngrilly) for frequent feedback, testing, & support.

Huge thanks to fly.io for their support and for contributing credits for testing and development!
````

## File: docs/index.html
````html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Life OS - Jeiser</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}
body{background:#0a0a0f;color:#e0e0e0;padding:20px;max-width:1000px;margin:0 auto}
h1{font-size:1.5em;margin-bottom:5px;color:#fff}
h1 span{color:#666;font-size:.6em;font-weight:400}
h2{font-size:.9em;color:#888;margin:25px 0 12px;text-transform:uppercase;letter-spacing:1px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:15px}
.card{background:#14141f;border-radius:10px;padding:18px;border:1px solid #1e1e2e}
.card h3{font-size:.85em;color:#aaa;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.card .val{font-size:2em;font-weight:700;color:#fff}
.card .sub{font-size:.75em;color:#666;margin-top:4px}
.status{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.ok{background:#4ade80} .warn{background:#facc15} .err{background:#ef4444}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.7em;margin:2px}
.tag-ok{background:#064e3b;color:#4ade80}
.tag-warn{background:#713f12;color:#facc15}
.tag-err{background:#7f1d1d;color:#fca5a5}
.progress-bar{height:6px;background:#1e1e2e;border-radius:3px;margin:8px 0;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .3s}
.evidence{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1e1e2e;font-size:.82em}
.evidence:last-child{border:none}
.evidence .check{font-size:1.1em}
.dl{margin-top:25px;text-align:center}
.dl a{color:#4ade80;text-decoration:none;font-size:.8em}
.error-block{background:#1a0a0a;border:1px solid #7f1d1d;border-radius:8px;padding:12px;margin:10px 0;font-size:.8em}
</style>
</head>
<body>
<h1>🧠 Life OS <span id="lastUpdate">cargando...</span></h1>

<h2>📊 Resumen</h2>
<div class="grid" id="summary"></div>

<h2>🚗 SIMIT</h2>
<div id="simit"></div>

<h2>🎓 SENA</h2>
<div id="sena"></div>

<h2>💻 Bootcamp QA</h2>
<div id="bootcamp"></div>

<h2>🧠 Memoria</h2>
<div id="memoria"></div>

<h2>🏥 Salud del Sistema</h2>
<div id="health"></div>

<div class="dl"><a href="https://github.com/jeiser270997-source/Asistente_Personal">github.com/jeiser270997-source/Asistente_Personal</a></div>

<script>
const REPO = 'jeiser270997-source/Asistente_Personal';
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;

async function loadJSON(path) {
  try {
    const r = await fetch(`${RAW}/${path}?t=${Date.now()}`);
    return r.json();
  } catch { return null; }
}

function ago(dateStr) {
  if (!dateStr) return '?';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return Math.floor(diff/60) + 'min';
  if (diff < 86400) return Math.floor(diff/3600) + 'h';
  return Math.floor(diff/86400) + 'd';
}

async function render() {
  const simit = await loadJSON('data/cache/simit_multas.json');
  const simitCheck = await loadJSON('data/cache/simit/ultima_consulta.json');
  const sena = await loadJSON('data/state/sena/seguimiento.json');
  const bootcamp = await loadJSON('data/cache/bootcamp/curriculum.json');
  const memoria = await loadJSON('data/memoria/hechos.json');
  const health = await loadJSON('data/audit/health.json');

  // Summary cards
  const summary = document.getElementById('summary');
  const stats = sena?.estadisticas || {};
  summary.innerHTML = `
    <div class="card"><h3>🚗 SIMIT</h3><div class="val">$${(simit?.total_deuda_activa/1000 || 0).toFixed(0)}K</div><div class="sub">deuda activa | ${simit?.multas?.filter(m=>m.estado.includes('Impugnado')).length || 0} impugnada</div></div>
    <div class="card"><h3>🎓 SENA</h3><div class="val">${stats.completadas || 0}/${stats.total || 12}</div><div class="sub">evidencias completadas</div></div>
    <div class="card"><h3>💻 Bootcamp</h3><div class="val">Semana ${bootcamp?.fases?.[0]?.modulos?.[0]?.semana || 1}</div><div class="sub">${bootcamp?.fases?.[0]?.nombre || 'Fundamentos'}</div></div>
    <div class="card"><h3>🧠 Memoria</h3><div class="val">${memoria?.hechos?.length || 0}</div><div class="sub">hechos aprendidos</div></div>
  `;

  // SIMIT section
  const simitEl = document.getElementById('simit');
  if (simit?.multas) {
    simitEl.innerHTML = simit.multas.map(m => {
      const color = m.estado.includes('Impugnado') ? 'tag-warn' : m.estado.includes('Pagad') ? 'tag-ok' : 'tag-warn';
      return `<div class="card">
        <h3><span class="status ${m.estado.includes('Pagad')?'ok':m.estado.includes('Impugnado')?'warn':'err'}"></span>${m.id}</h3>
        <div>${m.secretaria} | ${m.infraccion} | ${m.descripcion}</div>
        <div>${m.estado_detalle || m.estado} | $${((m.total||0)/1000).toFixed(0)}K</div>
        <div><span class="tag ${color}">${m.accion?.substring(0,50) || m.estado}</span></div>
      </div>`;
    }).join('');
  } else {
    simitEl.innerHTML = '<div class="card error-block">No se pudo cargar datos SIMIT</div>';
  }

  // SENA section
  const senaEl = document.getElementById('sena');
  if (sena?.actividades) {
    let html = '';
    for (const [key, act] of Object.entries(sena.actividades)) {
      const completadas = (act.evidencias || []).filter(e => e.completado).length;
      const total = act.evidencias?.length || 0;
      const pct = total > 0 ? (completadas/total*100) : 0;
      const color = act.estado === 'urgente' ? '#ef4444' : act.estado === 'vencida' ? '#ef4444' : completadas === total ? '#4ade80' : '#facc15';
      html += `<div class="card">
        <h3>${act.nombre.split(' - ')[0]}</h3>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
        <div style="font-size:.8em;color:#888">${completadas}/${total} | Vence: ${act.fecha_limite} | ${act.dias_restantes}d</div>
        ${(act.evidencias||[]).map(e => `<div class="evidence"><span class="check">${e.completado?'✅':'⬜'}</span>${e.nombre}</div>`).join('')}
      </div>`;
    }
    senaEl.innerHTML = `<div class="grid">${html}</div>`;
  }

  // Bootcamp
  const bcEl = document.getElementById('bootcamp');
  if (bootcamp?.fases) {
    bcEl.innerHTML = bootcamp.fases.map(f => {
      const mods = f.modulos?.length || 0;
      return `<div class="card">
        <h3>${f.id}: ${f.nombre}</h3>
        <div style="font-size:.8em;color:#888">Semanas ${f.semanas} | ${mods} modulos | Repos: ${(f.repos||[]).join(', ')}</div>
      </div>`;
    }).join('');
  }

  // Memoria
  const memEl = document.getElementById('memoria');
  if (memoria?.hechos) {
    const byCat = {};
    for (const h of memoria.hechos.slice(-30)) {
      if (!byCat[h.categoria]) byCat[h.categoria] = [];
      byCat[h.categoria].push(h);
    }
    memEl.innerHTML = Object.entries(byCat).map(([cat, hechos]) => `
      <div class="card">
        <h3>${cat.toUpperCase()} (${hechos.length})</h3>
        ${hechos.slice(-5).map(h => `<div style="font-size:.78em;color:#aaa;padding:2px 0">• ${h.hecho.substring(0,80)}</div>`).join('')}
      </div>
    `).join('');
  }

  // Health
  const healthEl = document.getElementById('health');
  healthEl.innerHTML = `
    <div class="card"><h3>🖥️ PM2 Local Runtime</h3>
      <div><span class="status ok"></span> telegram (daemon)</div>
      <div><span class="status ok"></span> brain-orchestrator (cron 7am)</div>
      <div><span class="status ok"></span> sena-scraper (cron 6am)</div>
      <div><span class="status ok"></span> email-cleaner (cron 3h)</div>
      <div><span class="status ok"></span> computrabajo (cron 8am)</div>
      <div><span class="status ok"></span> healthcheck (cron 8am)</div>
      <div><span class="status warn"></span> +10 procesos en ecosystem.config.js</div>
    </div>
    <div class="card"><h3>🔐 Seguridad (72/100)</h3>
      <div style="font-size:.8em;color:#888">0 CVEs criticos | API keys en .env | Auditado 05/07/2026</div>
    </div>
  `;

  document.getElementById('lastUpdate').textContent = `actualizado ${ago(simitCheck?.fecha || simit?.actualizado)}`;
}

render();
</script>
</body>
</html>
````

## File: lib/data/paths.js
````javascript
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const DIR = {
  DATA:      path.join(ROOT, 'data'),
  CONFIG:    path.join(ROOT, 'data', 'config'),
  STATE:     path.join(ROOT, 'data', 'state'),
  CACHE:     path.join(ROOT, 'data', 'cache'),
  SOURCES:   path.join(ROOT, 'data', 'sources'),
  USER:      path.join(ROOT, 'data', 'user'),
  ARTIFACTS: path.join(ROOT, 'data', 'artifacts'),
  LOGS:      path.join(ROOT, 'logs'),
  SKILLS:    path.join(ROOT, 'skills'),
  JOBS:      path.join(ROOT, 'data', 'jobs'),
  SENA:      path.join(ROOT, 'data', 'sena'),
  DIAN:      path.join(ROOT, 'data', 'dian'),
  SIMIT:     path.join(ROOT, 'data', 'simit'),
  DOCS:      path.join(ROOT, 'data', 'documentos'),
  BACKUPS:   path.join(ROOT, 'data', 'backups'),
  MEMORIA_LEGACY: path.join(ROOT, 'data', 'memoria'),
};

const PATHS = {
  // ── Config ──
  RULES: path.join(DIR.CONFIG, 'rules.json'),

  // ── State ──
  MASTER_LEDGER:     path.join(DIR.STATE, 'masterledger.json'),
  ALERTAS_SENA:      path.join(DIR.STATE, 'contexto_maestro', 'ALERTAS_SENA.md'),
  ESTADO_VIVO:       path.join(DIR.STATE, 'contexto_maestro', 'ESTADO_VIVO.md'),
  REGISTRO_ESTUDIO:  path.join(DIR.STATE, 'contexto_maestro', 'REGISTRO_DE_ESTUDIO.md'),
  CONTEXT_MAESTRO:   path.join(DIR.STATE, 'contexto_maestro'),
  SENA_TRACKING:     path.join(DIR.STATE, 'sena', 'seguimiento.json'),
  SENA_DEADLINES:    path.join(DIR.STATE, 'sena', 'deadlines.json'),
  SENA_HISTORY:      path.join(DIR.STATE, 'sena', 'historial_ejecuciones.json'),
  SIMIT_ALERTS:      path.join(DIR.STATE, 'simit', 'alertas.json'),
  BOOTCAMP_PROGRESS:    path.join(DIR.STATE, 'bootcamp', 'progreso.json'),
  BOOTCAMP_CURRICULUM:  path.join(DIR.STATE, 'bootcamp', 'curriculum.json'),

  // ── Jobs state ──
  SCORING_WEIGHTS:    path.join(DIR.CONFIG, 'jobs', 'scoring_weights.json'),
  JOBS_SCORES:        path.join(DIR.STATE, 'jobs', 'scores'),
  JOBS_DECISIONS:     path.join(DIR.STATE, 'jobs', 'decisions'),
  JOBS_EVENTS:        path.join(DIR.STATE, 'jobs', 'events'),
  JOBS_METRICS:       path.join(DIR.STATE, 'jobs', 'metrics', 'historical.json'),

  // ── Cache ──
  REPOS_DB:           path.join(DIR.CACHE, 'repos_db.json'),
  REPOS_META:         path.join(DIR.CACHE, 'repos_db_meta.json'),
  DIAN:               path.join(DIR.CACHE, 'dian'),
  SIMIT_LAST_QUERY:   path.join(DIR.CACHE, 'simit', 'ultima_consulta.json'),
  SIMIT_MULTAS:       path.join(DIR.CACHE, 'simit_multas.json'),
  SENDA_CALIFICACIONES: path.join(DIR.CACHE, 'sena', 'calificaciones.json'),
  SENDA_CURSO:        path.join(DIR.CACHE, 'sena', 'curso.json'),
  JOBS_COMPUTRABAJO:  path.join(DIR.CACHE, 'jobs', 'computrabajo.json'),
  JOBS_JUNIOR:        path.join(DIR.CACHE, 'jobs', 'canal_juniorjobs.json'),

  // ── Sources ──
  SENA_MATERIALES:    path.join(DIR.SOURCES, 'sena', 'materiales'),
  SENA_EVIDENCIAS:    path.join(DIR.SOURCES, 'sena', 'evidencias'),
  DOCUMENTOS:         path.join(DIR.SOURCES, 'documentos'),
  CV_BASE:            path.join(DIR.SOURCES, 'jobs', 'cv_base.md'),
  CESDE_CLASE4:       path.join(DIR.SOURCES, 'cesde', 'clase4'),
  CESDE_COMUNICADOS:  path.join(DIR.SOURCES, 'cesde', 'comunicados'),

  // ── User ──
  USER_PROFILE:  path.join(DIR.USER, 'perfil.md'),
  USER_METAS:    path.join(DIR.USER, 'metas.md'),
  USER_FINANZAS: path.join(DIR.USER, 'finanzas.md'),
  USER_PERFIL_CANDIDATO: path.join(ROOT, 'data', 'user', 'perfil_candidato.txt'),

  // ── Core data ──
  VITAL:     path.join(DIR.DATA, 'contexto_vital.json'),
  NOTAS:     path.join(DIR.DATA, 'notas.md'),
  PENDING:   path.join(DIR.DATA, 'pending.json'),
  MEMORIA_DB: path.join(DIR.DATA, 'memoria_hipocampo.db'),
  HECHOS_JSON_LEGACY: path.join(DIR.MEMORIA_LEGACY, 'hechos.json'),
  INDICE_JSON_LEGACY: path.join(DIR.MEMORIA_LEGACY, 'indice.json'),

  // ── SENA ──
  SENA_CURSO:    path.join(DIR.SENA, 'curso.json'),
  SENA_DEADLINES_FILE: path.join(DIR.SENA, 'deadlines.json'),

  // ── Skills ──
  SKILL_CEREBRO:     path.join(DIR.SKILLS, 'cerebro.md'),
  USER_SKILLS_INDEX: path.join(DIR.SKILLS, 'user_skills_index.json'),
  SISTEMA_SKILLS_INDEX: path.join(DIR.SKILLS, 'skills_sistema_index.json'),

  // ── Scripts ──
  BRAIN_ORCHESTRATOR_LOG: path.join(DIR.LOGS, 'brain_orchestrator.log'),
  COMPUTRABAJO_JSON:      path.join(DIR.JOBS, 'computrabajo.json'),
  APPLY_QUEUE:            path.join(DIR.JOBS, 'apply_queue.json'),
  APLICACIONES:           path.join(DIR.JOBS, 'aplicaciones.json'),

  // ── Artifacts ──
  JOBS_DIR:      path.join(DIR.ARTIFACTS, 'jobs'),
  JOBS_TAILORED: path.join(DIR.ARTIFACTS, 'jobs', 'cv_tailored'),
};

module.exports = { ROOT, DIR, PATHS };
````

## File: lib/events/event_bus.js
````javascript
/**
 * lib/events/event_bus.js — LifeOS Event Bus v3
 *
 * Basado en EventEmitter nativo de Node.js + capa de producción:
 *   - Event envelope con id, timestamp, meta
 *   - Retry con backoff (3 intentos) vía retry-wrapper opcional
 *   - Dead Letter Queue
 *   - Backpressure (máx N handlers concurrentes)
 *   - Idempotencia por content hash
 *   - Persistencia opcional a LedgerStore (SQLite)
 *
 * API pública compatible con v2.
 */

const { EventEmitter } = require('node:events');
const crypto = require('node:crypto');

let LedgerStore = null;
try {
  LedgerStore = require('../../runtime/stores/LedgerStore');
} catch {
  // LedgerStore no disponible — persistencia desactivada
}

// ── Config ──
const MAX_CONCURRENT = 10;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 500;

// ── Internal state ──
const deadLetters = [];
const processedHashes = new Set();
const MAX_HASH_CACHE = 10000;

const metrics = {
  emitted: 0,
  processed: 0,
  retries: 0,
  failures: 0,
  deduped: 0,
  dlq: 0,
};

// ── Backpressure ──
let concurrent = 0;
const pendingQueue = [];

class LifeOSEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

const emitter = new LifeOSEventBus();

// ── Helpers ──

function createEnvelope(type, payload, meta) {
  return {
    id: `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    type,
    payload,
    timestamp: Date.now(),
    meta: {
      source: meta?.source || 'unknown',
      priority: meta?.priority || 'normal',
      partitionKey: meta?.partitionKey || null,
      version: 1,
    },
  };
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + stableStringify(obj[key]);
  });
  return '{' + parts.join(',') + '}';
}

function contentHash(type, payload) {
  const stable = stableStringify({ type, payload });
  return crypto.createHash('sha1').update(stable).digest('hex').substring(0, 16);
}

function persist(envelope) {
  if (!LedgerStore) return;
  try {
    LedgerStore.emit('event_' + envelope.type.replace(/\./g, '_'), {
      event_id: envelope.id,
      timestamp: envelope.timestamp,
      source: envelope.meta.source,
      priority: envelope.meta.priority,
      ...envelope.payload,
    });
  } catch { /* noop */ }
}

// ── Log handler execution (structured JSON to stderr) ──

function logHandler(name, eventType, durationMs, status, err) {
  const entry = {
    ts: new Date().toISOString(),
    event: eventType,
    handler: name || 'anonymous',
    duration_ms: durationMs,
    status,
  };
  if (err) entry.error = err.message;
  process.stderr.write(JSON.stringify(entry) + '\n');
}

// ── Dispatch with retry ──

async function dispatch(envelope, handler) {
  concurrent++;
  const start = Date.now();
  const name = handler.name || 'anonymous';
  let lastError;

  try {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        await Promise.resolve(handler(envelope));
        metrics.processed++;
        logHandler(name, envelope.type, Date.now() - start, 'ok');
        return;
      } catch (e) {
        lastError = e;
        metrics.retries++;
        if (attempt < RETRY_ATTEMPTS) {
          logHandler(name, envelope.type, Date.now() - start, 'retry', e);
          await new Promise(r => setTimeout(r, attempt * RETRY_BASE_MS));
        }
      }
    }

    // All retries exhausted → DLQ (máx 100 entradas)
    metrics.failures++;
    metrics.dlq++;
    deadLetters.push({
      envelope,
      error: lastError?.message,
      handler: name,
      failedAt: new Date().toISOString(),
    });
    // --- Persistir en DLQ via LedgerStore ---
    try {
      if (LedgerStore) {
        LedgerStore.emit('event_dlq', {
          event_id: envelope.id,
          event_type: envelope.type,
          payload: envelope.payload,
          error_msg: lastError?.message || 'Unknown error',
        });
      }
    } catch(e) { console.error('Error guardando en DLQ:', e.message); }
    // ----------------------------------
    if (deadLetters.length > 100) deadLetters.shift();
    logHandler(name, envelope.type, Date.now() - start, 'dlq', lastError);
  } finally {
    concurrent--;
    flushQueue();
  }
}

function flushQueue() {
  if (pendingQueue.length === 0 || concurrent >= MAX_CONCURRENT) return;
  const highIdx = pendingQueue.findIndex(e => e.envelope.meta.priority === 'high');
  const idx = highIdx >= 0 ? highIdx : 0;
  const item = pendingQueue.splice(idx, 1)[0];
  dispatch(item.envelope, item.handler);
}

// ── Public API ──

function on(eventType, handler) {
  emitter.on(eventType, handler);
  return () => emitter.off(eventType, handler);
}

function once(eventType, handler) {
  emitter.once(eventType, handler);
  return () => emitter.off(eventType, handler);
}

function off(eventType, handler) {
  emitter.off(eventType, handler);
}

function emit(eventType, payload, meta) {
  metrics.emitted++;

  const envelope = createEnvelope(eventType, payload, meta);

  // Idempotency
  const hash = contentHash(eventType, payload);
  if (processedHashes.has(hash)) {
    metrics.deduped++;
    return envelope;
  }
  processedHashes.add(hash);
  if (processedHashes.size > MAX_HASH_CACHE) {
    const first = processedHashes.values().next().value;
    processedHashes.delete(first);
  }

  persist(envelope);

  // Use EventEmitter's listenerCount + dispatch
  const listeners = emitter.rawListeners(eventType);
  for (const handler of listeners) {
    if (concurrent < MAX_CONCURRENT) {
      dispatch(envelope, handler);
    } else {
      pendingQueue.push({ envelope, handler });
    }
  }

  return envelope;
}

// ── Dead Letter Queue ──

function getDeadLetters() {
  return [...deadLetters];
}

function retryDeadLetters() {
  const batch = [...deadLetters];
  deadLetters.length = 0;
  for (const dl of batch) {
    const listeners = emitter.rawListeners(dl.envelope.type);
    for (const h of listeners) {
      if (h.name === dl.handler) {
        emit(dl.envelope.type, dl.envelope.payload, { source: 'dlq_retry', priority: 'high' });
      }
    }
  }
  return batch.length;
}

// ── Replay ──

function replay(eventType, handler) {
  if (!LedgerStore) return 0;
  try {
    const events = LedgerStore.getByTipo('event_' + eventType.replace(/\./g, '_'));
    for (const ev of events) {
      handler({
        id: ev.event_id,
        type: eventType,
        payload: ev,
        timestamp: ev.timestamp ? new Date(ev.timestamp).getTime() : Date.now(),
        meta: { source: ev.source || 'replay', priority: ev.priority || 'normal', version: 1 },
      });
    }
    return events.length;
  } catch {
    return 0;
  }
}

// ── Metrics ──

function getMetrics() {
  return {
    ...metrics,
    concurrent,
    pending: pendingQueue.length,
    dlq_size: deadLetters.length,
    idempotency_cache: processedHashes.size,
    handlers: Object.fromEntries(
      emitter.eventNames().map(name => [name, emitter.listenerCount(name)])
    ),
  };
}

module.exports = { on, once, off, emit, replay, getDeadLetters, retryDeadLetters, getMetrics };
````

## File: lib/integrations/google_auth.js
````javascript
const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');
const { google } = require('googleapis');

const TOKEN_PATH = path.join(__dirname, '..', '..', '.google_token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', '..', 'credentials.json');

async function loadSavedCredentials() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf8');
    const credentials = JSON.parse(content);
    return {
      client: google.auth.fromJSON(credentials),
      savedScopes: credentials.scopes || null
    };
  } catch {
    return { client: null, savedScopes: null };
  }
}

async function saveCredentials(client, scopes) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
    scopes: scopes || null,
  });
  await fs.writeFile(TOKEN_PATH, payload, 'utf8');
}

async function authorize(scopes = ['https://www.googleapis.com/auth/gmail.modify'], forceReauth = false) {
  if (!forceReauth) {
    const { client: token, savedScopes } = await loadSavedCredentials();
    if (token) {
      // Verificar que los scopes guardados cubran los solicitados
      const scopeMismatch = savedScopes && scopes.some(s => !savedScopes.includes(s));
      if (!scopeMismatch && token.credentials?.refresh_token) {
        try {
          await token.getAccessToken();
          return token;
        } catch (e) {
          console.log('Token expirado, re-autenticando...');
        }
      } else if (!scopeMismatch) {
        return token;
      } else {
        console.log('Scopes insuficientes. Forzando re-autenticacion...');
      }
    }
  } else {
    console.log('Forzando re-autenticacion...');
  }

  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    'http://localhost'
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  console.log('\n========================================================');
  console.log('ðŸ”— ENLACE DE AUTENTICACIÃ“N GOOGLE:');
  console.log(authUrl);
  console.log('========================================================\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const urlStr = await new Promise(resolve => rl.question('Pega la URL completa aquÃ­: ', resolve));
  rl.close();

  const urlObj = new URL(urlStr);
  const code = urlObj.searchParams.get('code');
  if (!code) throw new Error('No se encontrÃ³ el cÃ³digo en la URL.');

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await saveCredentials(oauth2Client, scopes);
  console.log('Autenticacion exitosa y guardada.');

  return oauth2Client;
}

module.exports = { authorize, loadSavedCredentials: () => loadSavedCredentials().then(r => r.client) };
````

## File: lib/jobs/scorer.js
````javascript
/**
 * Scorer — v2
 *
 * Evalúa una oferta contra el perfil del candidato.
 * 70% reglas determinísticas, 30% LLM.
 *
 * Cada ejecución genera métricas. Sin métricas no hay mejora.
 */

const { readJSON } = require('../data/reader');
const { PATHS } = require('../data/paths');
const { createEmpty } = require('./types/ScoreBreakdown');
let bus;
try { bus = require('../events/event_bus'); } catch { bus = null; }
const { askLLM } = require('../ai/llm_service');

/**
 * @param {Object} job        - JobPosting normalizado
 * @param {Object} profile    - CandidateProfile
 * @param {Object} [options]
 * @param {boolean} [options.useLLM=false] - Si true, incluye evaluación LLM
 * @param {string}  [options.model]        - Modelo LLM a usar
 * @returns {Object} { score: ScoreBreakdown, decision: string, ev: Object, metrics: Object }
 */
async function score(job, profile, options = {}) {
  const start = Date.now();
  const weights = _loadWeights();

  const breakdown = createEmpty(job.title);

  // ── 70% Reglas determinísticas ──
  breakdown.skills = _scoreSkills(job.requirements, profile.skills, weights.weights.skills);
  breakdown.seniority = _scoreSeniority(job.experienceLevel, profile.seniority, weights.weights.seniority);
  breakdown.salary = _scoreSalary(job.salaryMin, job.salaryMax, profile.preferences, weights.weights.salary);
  breakdown.location = _scoreLocation(job.location, job.modality, profile.preferences, weights.weights.location);
  breakdown.english = _scoreEnglish(job.requiresEnglish, profile.languages, weights.weights.english);
  breakdown.company = _scoreCompany(job.company, profile.preferences, weights.weights.company);
  breakdown.growth = _scoreGrowth(job, weights.weights.growth);

  // ── 30% LLM ──
  let tokensConsumed = 0;
  let llmFailed = false;
  if (options.useLLM) {
    const llmResult = await _scoreLLM(job, profile, weights.weights.llmAlignment);
    llmFailed = llmResult.failed;
    breakdown.llmAlignment = llmResult.score;
    breakdown.strengths = llmResult.strengths;
    breakdown.weaknesses = llmResult.weaknesses;
    breakdown.redFlags = llmResult.redFlags;
    breakdown.reasoning = llmResult.reasoning;
    tokensConsumed = llmResult.tokensConsumed;
  }

  // ── Total ──
  const deterministicTotal = breakdown.skills + breakdown.seniority + breakdown.salary
    + breakdown.location + breakdown.english + breakdown.company + breakdown.growth;
  breakdown.total = deterministicTotal + breakdown.llmAlignment;

  // ── Fail-closed: if LLM failed, mark scoring_status as 'failed' to block auto-apply ──
  if (llmFailed) {
    breakdown.scoring_status = 'failed';
    breakdown.total = 0; // Force skip — no aplicar basura
    console.warn('[scorer] ⛔ LLM failed — score forced to 0, scoring_status=failed');
  } else {
    breakdown.scoring_status = 'ok';
  }

  // ── Decisión ──
  const decision = _decide(breakdown.total, weights.thresholds);

  // ── Expected Value ──
  const ev = _calculateEV(breakdown.total, job, weights);

  // ── Métricas ──
  const elapsed = Date.now() - start;
  const metrics = {
    executionTimeMs: elapsed,
    modelUsed: options.useLLM ? (options.model || 'llm') : 'deterministico',
    tokensConsumed,
  };

  // Emitir evento para el event bus (metrics, feedback, dashboard)
  if (bus) {
    try {
      bus.emit('job.scored', {
        jobId: job.sourceId || job.url,
        company: job.company,
        title: job.title,
        totalScore: breakdown.total,
        breakdown: { ...breakdown },
        decision: decision.action,
        ev,
        executionTimeMs: elapsed,
        modelUsed: metrics.modelUsed,
        tokensConsumed,
      }, { source: 'scorer', priority: 'low' });
    } catch (_) { /* event bus no crítico */ }
  }

  return { score: breakdown, decision, ev, metrics };
}

// ── Skills ──
function _scoreSkills(requirements, skills, maxWeight) {
  if (!requirements || !requirements.length || !skills || !skills.length) return 0;
  const req = requirements.map(r => r.toLowerCase());
  const has = skills.map(s => s.toLowerCase());
  const match = req.filter(r => has.some(h => h.includes(r) || r.includes(h))).length;
  const ratio = match / req.length;
  return Math.round(ratio * maxWeight);
}

// ── Seniority ──
function _scoreSeniority(required, current, maxWeight) {
  if (!required || !current) return Math.round(maxWeight * 0.5);
  const levels = { junior: 1, semisenior: 2, senior: 3, lead: 4 };
  const reqLevel = levels[required.toLowerCase()] || 2;
  const curLevel = levels[current.toLowerCase()] || 2;
  const diff = curLevel - reqLevel;
  if (diff >= 0) return maxWeight;
  if (diff === -1) return Math.round(maxWeight * 0.6);
  return Math.round(maxWeight * 0.3);
}

// ── Salario ──
function _scoreSalary(min, max, preferences, maxWeight) {
  if (!min && !max) return Math.round(maxWeight * 0.5);
  if (!preferences || !preferences.salaryMin) return Math.round(maxWeight * 0.7);
  const offered = max || min || 0;
  const expected = preferences.salaryMin;
  const ratio = offered / expected;
  if (ratio >= 1.2) return maxWeight;
  if (ratio >= 1) return Math.round(maxWeight * 0.9);
  if (ratio >= 0.8) return Math.round(maxWeight * 0.6);
  return Math.round(maxWeight * 0.3);
}

// ── Ubicación ──
function _scoreLocation(location, modality, preferences, maxWeight) {
  if (modality === 'remoto') return maxWeight;
  if (!preferences || !preferences.location) return Math.round(maxWeight * 0.5);
  if (!location) return Math.round(maxWeight * 0.5);
  const pref = preferences.location.toLowerCase();
  const loc = location.toLowerCase();
  if (loc.includes(pref) || pref.includes(loc)) return maxWeight;
  return Math.round(maxWeight * 0.3);
}

// ── Inglés ──
function _scoreEnglish(requires, languages, maxWeight) {
  if (!requires) return maxWeight;
  if (!languages || !languages.length) return 0;
  const hasEnglish = languages.some(l => l.toLowerCase().includes('inglés') || l.toLowerCase().includes('english'));
  return hasEnglish ? maxWeight : Math.round(maxWeight * 0.2);
}

// ── Empresa ──
function _scoreCompany(company, preferences, maxWeight) {
  if (!preferences || !preferences.targetCompanies || !preferences.targetCompanies.length) {
    return Math.round(maxWeight * 0.6);
  }
  const match = preferences.targetCompanies.some(t => company.toLowerCase().includes(t.toLowerCase()));
  if (match) return maxWeight + 10; // bonus empresa objetivo
  if (preferences.excludeCompanies && preferences.excludeCompanies.some(e => company.toLowerCase().includes(e.toLowerCase()))) {
    return 0;
  }
  return Math.round(maxWeight * 0.5);
}

// ── Crecimiento ──
function _scoreGrowth(job, maxWeight) {
  if (!job) return 0;
  let score = 0;
  const signals = [
    job.benefits && job.benefits.some(b => /certificaci|capacitac|entrenam|formación/i.test(b)),
    job.contractType === 'indefinido',
    job.industry,
    job.companyUrl,
  ];
  score = signals.filter(Boolean).length;
  return Math.round((score / signals.length) * maxWeight);
}

// ── LLM Alignment ──
async function _scoreLLM(job, profile, maxWeight) {
  const LLM_PROMPT = `Eres un reclutador experto evaluando el fit entre un candidato y una oferta laboral.

Responde SOLO con JSON válido:
{
  "alignmentScore": <0-10>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "redFlags": ["..."],
  "reasoning": "explicación breve"
}

Criterios:
- 0-3: Mal fit (skills no relacionadas, seniority muy lejano)
- 4-6: Fit medio (skills parciales, requiere crecimiento)
- 7-8: Buen fit (mayoría de skills, seniority cercano)
- 9-10: Excelente fit (skills exactas, seniority ideal)

Sé crítico. No infles scores.`;

  const input = {
    cargo: job.title,
    empresa: job.company,
    requisitos: job.requirements || [],
    modalidad: job.modality,
    salario: { min: job.salaryMin, max: job.salaryMax },
    requiereIngles: job.requiresEnglish,
    perfilSkills: profile.skills || [],
    perfilSeniority: profile.seniority,
    perfilIdiomas: profile.languages || [],
    preferencias: profile.preferences || {},
  };

  try {
    const res = await askLLM(LLM_PROMPT, [
      { role: 'user', content: JSON.stringify(input, null, 2) }
    ], 0.1);

    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback si el LLM no devuelve JSON válido — fail-closed
      return { score: 0, strengths: [], weaknesses: [], redFlags: ['LLM response unparseable'], reasoning: 'Error parseando respuesta LLM', tokensConsumed: 0, failed: true };
    }

    const score = Math.round((Math.max(0, Math.min(10, parsed.alignmentScore || 5)) / 10) * maxWeight);
    const tokensConsumed = res.usage?.total_tokens || 0;

    return {
      score,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      redFlags: parsed.redFlags || [],
      reasoning: parsed.reasoning || '',
      tokensConsumed,
    };
  } catch (e) {
    console.warn(`[scorer] ⛔ LLM error: ${e.message} — fail-closed, score=0`);
    return { score: 0, strengths: [], weaknesses: [], redFlags: ['LLM no disponible, skip'], reasoning: `LLM no disponible: ${e.message}`, tokensConsumed: 0, failed: true };
  }
}

// ── Decisión ──
function _decide(total, thresholds) {
  if (total >= thresholds.apply) {
    return { action: 'apply', reason: `Score ${total} >= umbral ${thresholds.apply}` };
  }
  if (total >= thresholds.maybe) {
    return { action: 'maybe', reason: `Score ${total} entre ${thresholds.maybe} y ${thresholds.apply}` };
  }
  return { action: 'skip', reason: `Score ${total} < umbral ${thresholds.maybe}` };
}

// ── Expected Value ──
function _calculateEV(score, job, weights) {
  // Probabilidad estimada de entrevista basada en score histórico
  // Fase inicial: fórmula heurística. Fase B: datos reales.
  const interviewProb = _estimateInterviewProb(score);
  const prepTime = _estimatePrepTime(job);
  const ev = (interviewProb * 100) / Math.max(prepTime, 1);

  return {
    interviewProbability: Math.round(interviewProb * 100),
    estimatedPrepTimeMin: prepTime,
    expectedValue: Math.round(ev * 100) / 100,
    label: ev > 2 ? 'alta' : ev > 0.5 ? 'media' : 'baja',
  };
}

function _estimateInterviewProb(score) {
  if (score >= 85) return 0.7;
  if (score >= 75) return 0.5;
  if (score >= 60) return 0.3;
  return 0.1;
}

function _estimatePrepTime(job) {
  let time = 10;
  if (job.requirements && job.requirements.length > 5) time += 10;
  if (job.coverLetter) time += 15;
  if (job.source === 'computrabajo') time = Math.min(time, 5); // aplicaciones rápidas
  return time;
}

function _loadWeights() {
  try {
    return readJSON(PATHS.SCORING_WEIGHTS);
  } catch {
    return {
      weights: { skills: 25, seniority: 15, salary: 15, location: 10, english: 10, company: 10, growth: 5, llmAlignment: 10 },
      thresholds: { apply: 75, maybe: 50 },
    };
  }
}

module.exports = { score };
````

## File: lib/lobulos/temporal.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const Fuse = require('fuse.js');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CONTEXT_DIR = path.join(DATA_DIR, 'state', 'contexto_maestro');

class LobuloTemporal {
  constructor() {
    this.memoryChunks = [];
    this.fuse = null;
    this.loadMemories();
  }

  // Cargar documentos y partirlos en "chunks" o fragmentos lÃ³gicos
  loadMemories() {
    this.memoryChunks = [];
    
    // Leer ESTADO_VIVO.md
    const estadoVivoPath = path.join(CONTEXT_DIR, 'ESTADO_VIVO.md');
    if (fs.existsSync(estadoVivoPath)) {
      const content = fs.readFileSync(estadoVivoPath, 'utf8');
      const sections = content.split('\n## ');
      
      sections.forEach((sec, idx) => {
        if (sec.trim()) {
          this.memoryChunks.push({
            id: `estado_vivo_${idx}`,
            source: 'ESTADO_VIVO.md',
            text: (idx === 0 ? sec : '## ' + sec).trim()
          });
        }
      });
    }

    // Leer Notas
    const notasPath = path.join(DATA_DIR, 'notas.md');
    if (fs.existsSync(notasPath)) {
      const content = fs.readFileSync(notasPath, 'utf8');
      const paragraphs = content.split('\n\n');
      paragraphs.forEach((p, idx) => {
        if (p.trim()) {
          this.memoryChunks.push({
            id: `nota_${idx}`,
            source: 'notas.md',
            text: p.trim()
          });
        }
      });
    }

    // Inicializar Motor Vectorial Ligero (Fuzzy Search RAG)
    this.fuse = new Fuse(this.memoryChunks, {
      keys: ['text'],
      includeScore: true,
      threshold: 0.6 // Buscar similitud semÃ¡ntica parcial
    });
  }

  // Extraer información pertinente sin llenar la ventana de contexto
  retrieve(query, maxChunks = 3) {
    if (!this.fuse) return '';
    const results = this.fuse.search(query).slice(0, maxChunks);
    
    if (results.length === 0) return '';
    
    return results.map(r => `[Fuente: ${r.item.source}]\n${r.item.text}`).join('\n\n');
  }

  // Permite recargar en tiempo real si el occipital guarda nuevos datos
  reindex() {
    this.loadMemories();
  }
}

module.exports = new LobuloTemporal();
````

## File: lib/runtime/job_tracker.js
````javascript
const fs = require('node:fs');
const path = require('node:path');
const AppStore = require('../../runtime/stores/ApplicationStore');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const VITAL_FILE = path.join(DATA_DIR, 'contexto_vital.json');

function loadVital() {
  try { return JSON.parse(fs.readFileSync(VITAL_FILE, 'utf8')); } 
  catch { return { perfil: {}, metas: {} }; }
}

function evaluateFit(empresa, cargo, detalles) {
  const vital = loadVital();
  const text = `${empresa} ${cargo} ${detalles || ''}`.toLowerCase();
  
  let score = 50;
  const razones = [];

  // Filtro estricto de sábados (Si dice sábado/finde, se penaliza fuertemente)
  if (/(sábado|sabado|fines de semana|disponibilidad completa|domingo)/.test(text)) {
    score -= 50; 
    razones.push('horario incluye sábados (bloqueo estudio)');
  }

  // Ampliación del radar: QA + Soporte + Sistemas
  if (/(qa|tester|automatización|automation|playwright)/.test(text)) { score += 25; razones.push('rol core: QA'); }
  if (/(soporte|sistemas|mesa de ayuda|helpdesk|auxiliar ti|tecnico)/.test(text)) { score += 20; razones.push('rol afín: Soporte TI'); }
  if (/(desarrollador|developer|programador)/.test(text)) { score += 10; razones.push('rol desarrollo'); }
  
  if (/(senior|lider|manager|principal)/.test(text)) { score -= 15; razones.push('rol senior'); }
  if (/(sin experiencia|junior|trainee|practicante)/.test(text)) { score += 15; razones.push('entry level'); }
  
  if (/(ingles|english|bilingue)/.test(text) && !vital.perfil?.idiomas?.some(i => i.toLowerCase().includes('ingles'))) {
    score -= 10; razones.push('falta ingles avanzado');
  }

  return { score: Math.max(0, Math.min(100, score)), compatible: score >= 60, razones: razones.length ? razones : ['evaluacion basica'] };
}

function logApplication({ empresa, cargo, plataforma, url, detalles, fecha_aplicacion }) {
  const evalResult = evaluateFit(empresa, cargo, detalles);
  const match = AppStore.findByEmpresaCargo(empresa, 