/**
 * job_loop.js — Pipeline completo de Job Hunter
 * Loop x5: Scrape → Analyze → Tailor CV → Apply (solo con --auto)
 *
 * Uso:
 *   node scripts/jobs/job_loop.js [--loops=5] [--min-score=40]
 *   node scripts/jobs/job_loop.js --auto          # LIVE: postula de verdad
 *   node scripts/jobs/job_loop.js --dry-run       # alias explícito de semi-auto (default)
 *
 * Política (single-tenant): SEMI-AUTO por defecto. Nunca postula sin --auto.
 */
require('dotenv').config();
const fs    = require('node:fs');
const path  = require('node:path');
const { execSync, spawn } = require('node:child_process');
const { askLLM } = require('../../lib/ai/llm_service');
const { PATHS }  = require('../../lib/data/paths');
const { escapeHTML } = require('../../lib/runtime/sanitize');
const { chromium } = require('playwright');
const { robustLogin, createLoggedInContext } = require('./ct_login_helper');

const CV_BASE   = PATHS.CV_BASE;
const CV_OUT    = PATHS.JOBS_TAILORED;
const APPLY_LOG = PATHS.APLICACIONES;
const JOBS_DIR  = PATHS.JOBS_DIR;

/**
 * Parsea flags de política de postulación.
 * Default: dry-run (semi-auto). LIVE solo con --auto y sin --dry-run.
 * @param {string[]} argv
 * @returns {{ auto: boolean, dryRun: boolean, mode: 'SEMI-AUTO'|'LIVE' }}
 */
function resolveApplyPolicy(argv = process.argv) {
  const auto = argv.includes('--auto');
  const forcedDry = argv.includes('--dry-run');
  const dryRun = !auto || forcedDry;
  return {
    auto: auto && !forcedDry,
    dryRun,
    mode: dryRun ? 'SEMI-AUTO' : 'LIVE',
  };
}

const LOOPS     = parseInt((process.argv.find(a => a.startsWith('--loops=')) || '--loops=5').split('=')[1], 10);
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=40').split('=')[1], 10);
const { dryRun: DRY_RUN, mode: APPLY_MODE } = resolveApplyPolicy(process.argv);

// Credenciales leídas al ejecutar main (no en import — permite tests de política)
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL;
const CT_PASS  = process.env.COMPUTRABAJO_PASS;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch (e) { console.error(`[Telegram Error] ${e.message}`); }
}

// â”€â”€â”€ SCRAPE LISTA DE OFERTAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function scrapeOfertasList() {
  const SEARCHES = [
    // Tech / QA
    'soporte-tecnico-software',
    'auxiliar-sistemas',
    'auxiliar-de-sistemas',
    'auxiliar-ti',
    'auxiliar-soporte',
    'auxiliar-tecnico',
    'mesa-de-ayuda',
    'helpdesk',
    'soporte-nivel-1',
    'soporte-tecnico',
    'soporte-it',
    'mesa-ayuda-sistemas',
    'tester-manual-software',
    'analista-qa-software',
    'qa-junior',
    'analista-pruebas',
    'practicante-qa',
    'qa-trainee',
    'software-qa-analyst',
    // Tech general
    'auxiliar-mantenimiento',
    'tecnico-sistemas',
    'tecnologo-sistemas',
    'tecnico-en-sistemas',
    'tecnico-ti',
    'tecnico-soporte',
    'tecnico-informatico',
    'auxiliar-informatica',
    'analista-soporte',
    'soporte-usuario',
    'service-desk',
    'soporte-software',
    'soporte-hardware',
    'monitoreo-sistemas',
    'operador-sistemas',
    'it-support',
  ];
  const { chromium: _c } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();
  const allOffers = [];

  for (const q of SEARCHES) {
    const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
      const offers = await page.evaluate((lbl) => {
        const results = [];
        const clean = s => (s || '').replace(/\s+/g, ' ').trim();
        // Palabras que indican que NO es tech (calidad industrial/construcciÃ³n)
        const NON_TECH = /andamio|ensamblador|elÃ©ctric|construcci|andamier|soldad|mecÃ¡ni|operari|producciÃ³n|manufactura|planta|textil|costura|bodega/i;
        const cards = document.querySelectorAll('article, [class*="offerItem"]');
        if (cards.length > 0) {
          Array.from(cards).slice(0, 12).forEach(card => {
            const titleEl = card.querySelector('h2 a, h3 a, a[title]');
            if (!titleEl) return;
            const titulo = clean(titleEl.textContent || titleEl.getAttribute('title'));
            if (NON_TECH.test(titulo)) return; // filtrar no-tech
            // Buscar URL directa de postulación (elemento con data-href-offer-apply)
            const applyEl = card.querySelector('[data-href-offer-apply]');
            const applyUrl = applyEl?.getAttribute('data-href-offer-apply') || '';
            results.push({
              titulo,
              empresa: clean(card.querySelector('p[title], [class*="company"]')?.getAttribute('title') || card.querySelector('p[title], [class*="company"]')?.textContent),
              lugar:   clean(card.querySelector('[class*="city"], [class*="location"]')?.textContent),
              url:     titleEl.href || '',
              apply_url: applyUrl,
              id:      (titleEl.href || '').match(/oferta-([\w-]+)/)?.[1] || Math.random().toString(36).slice(2),
            });
          });
        } else {
          document.querySelectorAll('a[href*="oferta-"]').forEach((a, i) => {
            if (i >= 12) return;
            const text = clean(a.textContent);
            if (text.length > 5 && !NON_TECH.test(text)) results.push({ titulo: text, empresa: '', lugar: '', url: a.href, id: a.href.match(/oferta-([\w-]+)/)?.[1] || Math.random().toString(36).slice(2) });
          });
        }
        return results;
      }, q);
      allOffers.push(...offers.map(o => ({ ...o, categoria: q, scraped_at: new Date().toISOString() })));
      log(`  [scrape] ${q}: ${offers.length} ofertas`);
    } catch (e) {
      log(`  [scrape] âš  ${q}: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(1000);
  }
  await browser.close();

  // Deduplicar
  const seen = new Set();
  return allOffers.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });
}

// â”€â”€â”€ SCRAPE DESCRIPCIÃ“N COMPLETA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function scrapeDescripcion(url, browser) {
  const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    const desc = await page.evaluate(() => {
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();
      const body = document.querySelector('[class*="description"], [class*="jobDescription"], #job-body, .jobDescriptionSection, main');
      return clean(body?.innerText || document.body.innerText).substring(0, 3000);
    });
    await ctx.close();
    return desc;
  } catch (e) {
    await ctx.close();
    return '';
  }
}

// â”€â”€â”€ ANALIZAR COMPATIBILIDAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @typedef {Object} AnalisisResult
 * @property {number} score
 * @property {string} nivel_requerido
 * @property {string[]} skills_match
 * @property {string[]} skills_gap
 * @property {string} salario_estimado
 * @property {string} modalidad
 * @property {boolean} recomendar
 * @property {string} razon_corta
 * @property {string} tip_postulacion
 */

/**
 * @param {Object} oferta
 * @param {string} cvBase
 * @returns {Promise<AnalisisResult>}
 */
async function analizarOferta(oferta, cvBase) {
  const desc = oferta.descripcion || oferta.titulo;
  const prompt = `Eres un experto en reclutamiento tech en Colombia. Analiza la compatibilidad entre este candidato y la oferta.

CANDIDATO - Jeiser Gutierrez:
- QA Automation Junior (CESDE bootcamp 2026, 28 semanas)
- Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL bÃ¡sico
- Experiencia PrÃ¡ctica: Creador de LifeOS (sistema autÃ³nomo de producciÃ³n con 11 workflows CI/CD, scraping, integraciÃ³n LLM y base de datos SQLite).
- Disponible: tiempo completo o medio tiempo, Medellín + remoto

REGLA DE EVALUACIÓN CLAVE:
Ignora los requisitos corporativos rígidos de "1 o 2 años de experiencia formal". El proyecto LifeOS demuestra habilidades avanzadas equivalentes a +1 año de experiencia real. Si la vacante es Junior/Trainee y los skills técnicos (JS, Playwright, Automation) hacen match, asígnele un score ALTO (>= 60) y evalúa su capacidad real.
NUEVA DIRECTRIZ (SOPORTE TI): El candidato (Jeiser) busca activamente roles de Soporte Técnico, Mesa de Ayuda, Helpdesk y Auxiliar de Sistemas para entrar a la industria tecnológica mientras estudia (usando su experiencia previa bilingüe en Sitel/Amadeus y sólidos conocimientos de SO y hardware). Asigne scores MUY ALTOS (>=60) a estos roles, siempre que no impliquen solo cargar cajas.

REGLAS ESTRICTAS: NO asignar score > 30 a roles de: Analista de Oxígeno, SST, Químico, Fisicoquímico, Calidad industrial (alimentos, laboratorio, procesos). Solo si la descripción menciona herramientas de software explícitamente.
OFERTA: ${oferta.titulo} | ${oferta.empresa} | ${oferta.lugar}
DESCRIPCIÃ“N: ${desc.substring(0, 1500)}

Responde SOLO en JSON vÃ¡lido:
{
  "score": <0-100>,
  "nivel_requerido": "junior|mid|senior",
  "skills_match": ["skill1", "skill2"],
  "skills_gap": ["gap1", "gap2"],
  "salario_estimado": "$X.XXX.000 - $Y.YYY.000",
  "modalidad": "remoto|presencial|hibrido",
  "recomendar": true/false,
  "razon_corta": "una frase",
  "tip_postulacion": "quÃ© enfatizar en la carta"
}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { score: 0, recomendar: false, razon_corta: 'LLM no disponible — fail-closed', skills_match: [], skills_gap: [], scoring_status: 'failed' };
  }
}

// â”€â”€â”€ TAILORING CV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function tailorCV(oferta, analisis, cvBase) {
  const prompt = `Personaliza este CV para la oferta especÃ­fica. Usa el anÃ¡lisis previo para saber quÃ© enfatizar.

OFERTA: ${oferta.titulo} â€” ${oferta.empresa}
SKILLS A DESTACAR: ${(analisis.skills_match || []).join(', ')}
TIP: ${analisis.tip_postulacion || ''}
DESCRIPCIÃ“N: ${(oferta.descripcion || oferta.titulo).substring(0, 1000)}

CV BASE:
${cvBase}

INSTRUCCIONES:
1. AÃ±ade un RESUMEN PROFESIONAL de 2-3 lÃ­neas especÃ­fico para esta oferta
2. Reordena skills: primero las que piden, luego las demÃ¡s
3. Ajusta LifeOS project para enfatizar lo relevante para esta oferta
4. MantÃ©n TODO verÃ­dico â€” no inventes nada
5. Formato Markdown limpio Harvard â€” mÃ¡x 1 pÃ¡gina al imprimir
6. Devuelve SOLO el CV en Markdown`;

  const res = await askLLM(prompt, [], 0.3);
  return (res.content || '').replace(/```markdown|```/g, '').trim();
}

// ═══════════ APLICAR OFERTA ══════════════════════════════════════════════════════════
// Flujo directo: usa la apply_url (data-href-offer-apply) del scraper si existe.
// Si no, navega a la oferta y clickea Aplicar → Enviar mi HdV.

async function aplicar(oferta, browser) {
  if (DRY_RUN) { log('  [dry-run] Saltando aplicación'); return { exito: false, razon: 'dry-run' }; }

  const ctx  = await createLoggedInContext(browser);
  const page = await ctx.newPage();
  try {
    const loginOk = await robustLogin(page, CT_EMAIL, CT_PASS);
    if (!loginOk) {
      await ctx.close();
      return { exito: false, razon: 'No se pudo iniciar sesión' };
    }

    // ── ESTRATEGIA 1: URL directa de apply (data-href-offer-apply) ──
    if (oferta.apply_url) {
      const fullApplyUrl = oferta.apply_url.startsWith('http')
        ? oferta.apply_url
        : `https://candidato.co.computrabajo.com${oferta.apply_url}`;
      log(`  [apply] 🚀 Intentando URL directa: ${fullApplyUrl.substring(0, 80)}...`);
      try {
        const resp = await page.goto(fullApplyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(4000);
        // Verificar si la página indica que ya aplicó o es éxito
        const texto = await page.evaluate(() => document.body.innerText);
        if (resp && resp.status() !== 404 && !/página no encontrada|no disponible|error 404/i.test(texto)) {
          log('  [apply] ✅ URL directa cargada correctamente');
        } else {
          log('  [apply] ⚠ URL directa devolvió 404 — usando flujo alternativo');
          throw new Error('direct-url-404');
        }
      } catch {
        // Fallback: navegar a la página de la oferta y clickear
        log('  [apply] 🌐 Fallback a página de oferta...');
        await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);

        // Cerrar banner de cookies
        try {
          const cookieBtn = page.locator('#cookie-banner button, button:has-text("Aceptar"), .cc-btn:has-text("Aceptar"), #cookiesjsv2-accept').first();
          if (await cookieBtn.count() > 0 && await cookieBtn.isVisible().catch(() => false)) {
            await cookieBtn.click({ timeout: 3000, force: true });
            await page.waitForTimeout(1000);
            log('  [apply] 🍪 Banner de cookies cerrado');
          }
        } catch {}

        // Click "Aplicar"
        const aplicarBtn = page.locator('a.b_primary:has-text("Aplicar"), button:has-text("Aplicar"), a:has-text("Postularme"), button:has-text("Postularme")').first();
        if (await aplicarBtn.count() > 0 && await aplicarBtn.isVisible().catch(() => false)) {
          await aplicarBtn.click({ timeout: 5000 });
          log('  [apply] 🖱️ Click en Aplicar');
          await page.waitForTimeout(4000);

          // Click "Enviar mi HdV" — nativo + dispatchEvent
          for (let i = 0; i < 5; i++) {
            const hdvBtn = page.locator('a:has-text("Enviar mi HdV"), button:has-text("Enviar mi HdV")').first();
            if (await hdvBtn.count() > 0 && await hdvBtn.isVisible().catch(() => false)) {
              await hdvBtn.click({ timeout: 3000, force: true });
              log('  [apply] ✅ "Enviar mi HdV" clickeado');
              break;
            }
            const hdvOk = await page.evaluate(() => {
              for (const el of document.querySelectorAll('a, button')) {
                if (/Enviar mi HdV/i.test(el.textContent || '') && el.offsetParent !== null) {
                  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: 100, clientY: 100 }));
                  return true;
                }
              }
              return false;
            });
            if (hdvOk) { log('  [apply] ✅ Enviar mi HdV (dispatchEvent)'); break; }
            await page.waitForTimeout(1000);
          }
        } else {
          log('  [apply] ⚠ No se encontró botón Aplicar');
        }
      }
    } else {
      // ── ESTRATEGIA 2: Sin apply_url → flujo por página de oferta ──
      log('  [apply] 🌐 Sin apply_url, navegando a la oferta...');
      await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      try {
        const cookieBtn = page.locator('#cookie-banner button, button:has-text("Aceptar"), .cc-btn:has-text("Aceptar"), #cookiesjsv2-accept').first();
        if (await cookieBtn.count() > 0 && await cookieBtn.isVisible().catch(() => false)) {
          await cookieBtn.click({ timeout: 3000, force: true }); await page.waitForTimeout(1000);
        }
      } catch {}
      const aplicarBtn = page.locator('a.b_primary:has-text("Aplicar"), button:has-text("Aplicar"), a:has-text("Postularme"), button:has-text("Postularme")').first();
      if (await aplicarBtn.count() > 0 && await aplicarBtn.isVisible().catch(() => false)) {
        await aplicarBtn.click({ timeout: 5000 });
        await page.waitForTimeout(4000);
        for (let i = 0; i < 5; i++) {
          const hdvBtn = page.locator('a:has-text("Enviar mi HdV"), button:has-text("Enviar mi HdV")').first();
          if (await hdvBtn.count() > 0 && await hdvBtn.isVisible().catch(() => false)) {
            await hdvBtn.click({ timeout: 3000, force: true }); break;
          }
          const hdvOk = await page.evaluate(() => {
            for (const el of document.querySelectorAll('a, button')) {
              if (/Enviar mi HdV/i.test(el.textContent || '') && el.offsetParent !== null) {
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: 100, clientY: 100 }));
                return true;
              }
            }
            return false;
          });
          if (hdvOk) break;
          await page.waitForTimeout(1000);
        }
      }
    }

    // Esperar AJAX y verificar en /candidate/match
    await page.waitForTimeout(3000);
    log('  [apply] 🔍 Verificando en /candidate/match...');
    await page.goto('https://candidato.co.computrabajo.com/candidate/match', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(4000);

    const matchResult = await page.evaluate(({ titulo, empresa }) => {
      const body = document.body.innerText;
      const matchStr = titulo.substring(0, 25).toLowerCase();

      // Buscar líneas que contengan el título (o parte de él)
      const lineas = body.split('\n').filter(l => l.toLowerCase().includes(matchStr));

      // Buscar indicador explícito de "Postulado" o "Aplicado"
      const tienePostulado = /postulado|aplicado|inscrito/i.test(body);
      const postuladoCerca = lineas.some(l => /postulado|aplicado|inscrito/i.test(l));

      return {
        encontrado: lineas.length > 0,
        postulado: tienePostulado,
        postuladoCerca: postuladoCerca,
        lineas: lineas.slice(0, 4).map(l => l.trim().substring(0, 120)),
      };
    }, { titulo: oferta.titulo, empresa: oferta.empresa });

    const shot = path.join(JOBS_DIR, `apply_${oferta.id}_${Date.now()}.png`);
    await page.screenshot({ path: shot }).catch(() => {});

    if (matchResult.encontrado && matchResult.postulado) {
      log(`  [apply] ✅ Postulación CONFIRMADA — "Postulado" encontrado en match`);
      if (matchResult.lineas.length > 0) log(`       └─ ${matchResult.lineas[0]}`);
      await ctx.close();
      return { exito: true, razon: 'Postulación CONFIRMADA — Postulado ✓', postulado: true, screenshot: shot };
    }

    if (matchResult.encontrado) {
      log(`  [apply] ⚠ La oferta aparece en match pero sin marca "Postulado" explícita`);
      if (matchResult.lineas.length > 0) log(`       └─ ${matchResult.lineas[0]}`);
      await ctx.close();
      return { exito: true, razon: 'Oferta visible en match (sin Postulado explícito)', postulado: matchResult.postuladoCerca, screenshot: shot };
    }

    log('  [apply] ❌ No apareció en match');
    await ctx.close();
    return { exito: false, razon: 'No confirmado en match', postulado: false, screenshot: shot };

  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 80) };
  }
}
async function main() {
  if (!CT_EMAIL) {
    console.error('FATAL: COMPUTRABAJO_EMAIL no está configurado en .env');
    process.exit(1);
  }
  ensureDir(CV_OUT);
  const cvBase = fs.readFileSync(CV_BASE, 'utf8');
  const aplicaciones = fs.existsSync(APPLY_LOG) ? JSON.parse(fs.readFileSync(APPLY_LOG, 'utf8')) : [];
  const yaAplicadas = new Set(aplicaciones.map(a => a.oferta_id || a.url));

  log('═══════════════════════════════════════════════════');
  log(`🚀 JOB LOOP x${LOOPS} | min-score: ${MIN_SCORE} | ${APPLY_MODE}${DRY_RUN ? ' (no postula)' : ' ⚠️ POSTULA'}`);
  if (DRY_RUN) {
    log('   Política: semi-auto. Para LIVE: node scripts/jobs/job_loop.js --auto');
  }
  log('═══════════════════════════════════════════════════');

  const resultados = [];
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  for (let loop = 1; loop <= LOOPS; loop++) {
    log(`\nâ”â”â” LOOP ${loop}/${LOOPS} â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`);

    // PASO 1: Scrape
    log('ðŸ“¡ [1/4] Scraping Computrabajo...');
    const ofertas = await scrapeOfertasList();
    const UBICACIONES_OK  = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|teletrabajo|estrella|itag[ií]|envigado|sabaneta|bello|riv[ií]|valle.aburr[aá]/i;
    const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa.marta/i;

    const nuevas = ofertas.filter(o => {
      if (yaAplicadas.has(o.id)) return false;
      const texto = ((o.lugar || '') + ' ' + (o.url || '')).toLowerCase();
      if (UBICACIONES_NOK.test(texto) && !UBICACIONES_OK.test(texto)) return false;
      return true;
    });
    log(`  Total: ${ofertas.length} | Nuevas (Medellín/Remoto): ${nuevas.length}`);

    if (nuevas.length === 0) {
      log('  Sin ofertas nuevas en Medellín/Remoto este loop.');
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    // Guardar todas en disco
    fs.writeFileSync(path.join(JOBS_DIR, 'computrabajo.json'),
      JSON.stringify({ fecha: new Date().toISOString(), total: ofertas.length, ofertas }, null, 2));

    // Procesar top 5 nuevas por loop
    const toProcess = nuevas.slice(0, 5);
    log(`  Procesando ${toProcess.length} ofertas...`);

    for (const oferta of toProcess) {
      log(`\n  ðŸ“‹ "${oferta.titulo}" â€” ${oferta.empresa}`);

      // PASO 2: Scrape descripciÃ³n completa
      log('  ðŸ” [2/4] Scrapeando descripciÃ³n...');
      oferta.descripcion = await scrapeDescripcion(oferta.url, browser);

      // PASO 3: Analizar
      log('  ðŸ§  [3/4] Analizando compatibilidad...');
      const analisis = await analizarOferta(oferta, cvBase);
      log(`       Score: ${analisis.score}/100 | ${analisis.nivel_requerido} | ${analisis.razon_corta}`);
      log(`       Match: [${(analisis.skills_match||[]).join(', ')}]`);
      if ((analisis.skills_gap||[]).length > 0) log(`       Gap:   [${analisis.skills_gap.join(', ')}]`);

      const registro = {
        oferta_id: oferta.id,
        url: oferta.url,
        titulo: oferta.titulo,
        empresa: oferta.empresa,
        lugar: oferta.lugar || '',
        fecha: new Date().toISOString(),
        loop,
        analisis,
        estado: 'analizado',
        cv_path: null,
      };

      // PASO 4: Tailoring + Apply si score >= MIN_SCORE
      if (analisis.score >= MIN_SCORE && analisis.recomendar) {
        log(`  âœ‚ï¸  [4/4] Tailoring CV (score ${analisis.score} â‰¥ ${MIN_SCORE})...`);
        try {
          const cvTailored = await tailorCV(oferta, analisis, cvBase);
          const slug = oferta.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 35);
          const cvPath = path.join(CV_OUT, `cv_${slug}_loop${loop}.md`);
          fs.writeFileSync(cvPath, cvTailored, 'utf8');
          registro.cv_path = cvPath;
          log(`       CV guardado: ${path.basename(cvPath)}`);

          // Aplicar solo en LIVE (--auto). Default: encolar / notificar.
          if (DRY_RUN) {
            registro.estado = 'pendiente_revision';
            log('       ⏸️  SEMI-AUTO: CV listo, NO se postuló (falta --auto)');
            await sendTelegram(
              `\u{1F4CB} <b>Candidato listo (semi-auto)</b>\n${escapeHTML(oferta.titulo)} \u2014 ${escapeHTML(oferta.empresa)}\nScore: ${analisis.score}/100\n<a href="${escapeHTML(oferta.url)}">Ver oferta</a>\nPara aplicar: <code>node scripts/jobs/job_loop.js --auto</code>`
            );
          } else {
            log('  🚀  Aplicando (LIVE --auto)...');
            const resultado = await aplicar(oferta, browser);
            registro.estado = resultado.exito ? 'aplicado' : `error_apply: ${resultado.razon}`;
            registro.screenshot = resultado.screenshot;

            if (resultado.exito) {
              yaAplicadas.add(oferta.id);
              log('       ✅ APLICADO');
              await sendTelegram(`\u2705 <b>Aplicaci\u00F3n enviada</b>\n${escapeHTML(oferta.titulo)} \u2014 ${escapeHTML(oferta.empresa)}\nScore: ${analisis.score}/100\n<a href="${escapeHTML(oferta.url)}">Ver oferta</a>`);
            } else {
              log(`       ⚠ No confirmado: ${resultado.razon}`);
            }
          }
        } catch (e) {
          log(`  âš  Error tailoring/apply: ${e.message.substring(0, 80)}`);
          registro.estado = 'error: ' + e.message.substring(0, 60);
        }
      } else {
        log(`  â­  Descartada (score ${analisis.score} < ${MIN_SCORE} o recomendar=${analisis.recomendar})`);
        registro.estado = 'descartada';
      }

      resultados.push(registro);
      aplicaciones.push(registro);
      const tmp = APPLY_LOG + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(aplicaciones, null, 2));
      fs.renameSync(tmp, APPLY_LOG);
    }

    // Pausa entre loops
    if (loop < LOOPS) {
      log(`\n  â¸ Pausa 5s entre loops...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await browser.close();

  // RESUMEN FINAL
  const aplicadas  = resultados.filter(r => r.estado === 'aplicado');
  const pendientes = resultados.filter(r => r.estado === 'pendiente_revision');
  const analizadas = resultados.filter(r => r.analisis);
  const descartadas = resultados.filter(r => r.estado === 'descartada');

  log('\n═══════════════════════════════════════════════════');
  log(`📊 RESUMEN FINAL (${APPLY_MODE})`);
  log('═══════════════════════════════════════════════════');
  log(`Total analizadas: ${analizadas.length}`);
  log(`✅ Aplicadas:     ${aplicadas.length}`);
  log(`📋 Pendientes:    ${pendientes.length} (semi-auto, sin --auto)`);
  log(`⏭ Descartadas:   ${descartadas.length}`);
  log('\nTop ofertas por score:');
  resultados
    .filter(r => r.analisis)
    .sort((a, b) => (b.analisis.score||0) - (a.analisis.score||0))
    .slice(0, 8)
    .forEach(r => {
      const icon = r.estado === 'aplicado' ? '✅' : r.estado === 'pendiente_revision' ? '📋' : r.estado === 'descartada' ? '⏭' : '📄';
      log(`  ${icon} [${r.analisis.score}] ${r.titulo} — ${r.empresa} | ${r.analisis.razon_corta}`);
    });

  const msg = `\u{1F3AF} <b>Job Loop x${LOOPS} (${APPLY_MODE})</b>\nAnalizadas: ${analizadas.length} | Aplicadas: ${aplicadas.length} | Pendientes: ${pendientes.length}\n${[...aplicadas, ...pendientes].map(r => `${r.estado === 'aplicado' ? '\u2705' : '\u{1F4CB}'} ${escapeHTML(r.titulo)} \u2014 ${escapeHTML(r.empresa)}`).join('\n')}`;
  await sendTelegram(msg);

  log('\n✅ Datos en: ' + JOBS_DIR);
}

// Export para tests de política (sin ejecutar main)
module.exports = { resolveApplyPolicy };

if (require.main === module) {
  main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
}

