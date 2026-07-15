/**
 * job_loop.js â€” Pipeline completo de Job Hunter
 * Loop x5: Scrape â†’ Analyze â†’ Tailor CV â†’ Apply
 * 
 * Uso: node scripts/job_loop.js [--loops=5] [--min-score=60] [--dry-run]
 *   --dry-run: analiza y genera CVs pero NO aplica
 */
require('dotenv').config();
const fs    = require('node:fs');
const path  = require('node:path');
const { execSync, spawn } = require('node:child_process');
const { askLLM } = require('../../lib/ai/llm_service');
const { PATHS }  = require('../../lib/data/paths');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const CV_BASE   = PATHS.CV_BASE;
const CV_OUT    = PATHS.JOBS_TAILORED;
const APPLY_LOG = PATHS.APLICACIONES;


const LOOPS     = parseInt((process.argv.find(a => a.startsWith('--loops=')) || '--loops=5').split('=')[1]);
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const DRY_RUN   = process.argv.includes('--dry-run');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
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
    'tester-manual-software',
    'analista-qa-software',
    'qa-junior',
    'analista-pruebas',
    'practicante-qa',
    'soporte-tecnico-software',
    'qa-trainee',
    'software-qa-analyst',
    'auxiliar-sistemas',
    'mesa-de-ayuda',
    'helpdesk',
    'soporte-nivel-1',
    'mesa-ayuda-sistemas',
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
            results.push({
              titulo,
              empresa: clean(card.querySelector('p[title], [class*="company"]')?.getAttribute('title') || card.querySelector('p[title], [class*="company"]')?.textContent),
              lugar:   clean(card.querySelector('[class*="city"], [class*="location"]')?.textContent),
              url:     titleEl.href || '',
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

REGLA DE EVALUACIÃ“N CLAVE:
Ignora los requisitos corporativos rÃ­gidos de "1 o 2 aÃ±os de experiencia formal". El proyecto LifeOS demuestra habilidades avanzadas equivalentes a +1 aÃ±o de experiencia real. Si la vacante es Junior/Trainee y los skills tÃ©cnicos (JS, Playwright, Automation) hacen match, asÃ­gnale un score ALTO (>= 60) y evalÃºa su capacidad real, no los aÃ±os en papel.

n	REGLAS ESTRICTAS: NO asignar score > 30 a roles de: Analista de OxÃ­geno, SST, QuÃ­mico, FisicoquÃ­mico, Calidad industrial (alimentos, laboratorio, procesos). Solo si la descripciÃ³n menciona herramientas de software explÃ­citamente.
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
    return { score: 50, recomendar: true, razon_corta: 'AnÃ¡lisis manual requerido', skills_match: [], skills_gap: [] };
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

// â”€â”€â”€ APLICAR OFERTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function aplicar(oferta, browser) {
  if (DRY_RUN) { log('  [dry-run] Saltando aplicaciÃ³n'); return { exito: false, razon: 'dry-run' }; }

  const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' });
  const page = await ctx.newPage();
  try {
    // Login
    await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await robustLogin(page, CT_EMAIL, CT_PASS);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Navegar a oferta
    await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // BotÃ³n postularme
    const btnSelectors = [
      'a:has-text("Aplicar")', 'button:has-text("Aplicar")',
      'button:has-text("Postularme")', 'button:has-text("Postular")',
      'a:has-text("Postularme")', 'a:has-text("Postular")',
      '.js-apply-btn', '[data-qa="applyButton"]', '.b_primary.tiny',
    ];
    let clicked = false;
    for (const sel of btnSelectors) {
      try { await page.click(sel, { timeout: 3000 }); clicked = true; break; } catch (e) { log(`  [debug] btn no matchea: ${sel}`); }
    }

    if (!clicked) {
      await ctx.close();
      return { exito: false, razon: 'BotÃ³n postularme no encontrado' };
    }

    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    const confirmado = await page.evaluate(() =>
      /postul|envi|éxito|registrad|aplicac/i.test(document.body.innerText)
    );

    const shot = path.join(JOBS_DIR, `apply_${oferta.id}_${Date.now()}.png`);
    await page.screenshot({ path: shot });
    await ctx.close();
    return { exito: confirmado, razon: confirmado ? 'PostulaciÃ³n enviada' : 'No confirmado', screenshot: shot };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 80) };
  }
}

// â”€â”€â”€ MAIN LOOP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  ensureDir(CV_OUT);
  const cvBase = fs.readFileSync(CV_BASE, 'utf8');
  const aplicaciones = fs.existsSync(APPLY_LOG) ? JSON.parse(fs.readFileSync(APPLY_LOG, 'utf8')) : [];
  const yaAplicadas = new Set(aplicaciones.map(a => a.oferta_id || a.url));

  log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  log(`ðŸš€ JOB LOOP x${LOOPS} | min-score: ${MIN_SCORE} | ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

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
    const UBICACIONES_OK  = /medell[iÃ­]n|antioquia|remoto|remote|virtual|home.?office|teletrabajo/i;
    const UBICACIONES_NOK = /bogot[aÃ¡]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eÃ©]|santa marta/i;

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

          // Aplicar
          log('  ðŸš€  Aplicando...');
          const resultado = await aplicar(oferta, browser);
          registro.estado = resultado.exito ? 'aplicado' : `error_apply: ${resultado.razon}`;
          registro.screenshot = resultado.screenshot;

          if (resultado.exito) {
            yaAplicadas.add(oferta.id);
            log(`       âœ… APLICADO`);
            await sendTelegram(`\u2705 <b>Aplicaci\u00F3n enviada</b>\n${oferta.titulo} \u2014 ${oferta.empresa}\nScore: ${analisis.score}/100\n<a href="${oferta.url}">Ver oferta</a>`);
          } else {
            log(`       âš  No confirmado: ${resultado.razon}`);
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
      fs.writeFileSync(APPLY_LOG, JSON.stringify(aplicaciones, null, 2));
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
  const analizadas = resultados.filter(r => r.analisis);
  const descartadas = resultados.filter(r => r.estado === 'descartada');

  log('\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  log('ðŸ“Š RESUMEN FINAL');
  log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  log(`Total analizadas: ${analizadas.length}`);
  log(`âœ… Aplicadas:     ${aplicadas.length}`);
  log(`â­ Descartadas:   ${descartadas.length}`);
  log('\nTop ofertas por score:');
  resultados
    .filter(r => r.analisis)
    .sort((a, b) => (b.analisis.score||0) - (a.analisis.score||0))
    .slice(0, 8)
    .forEach(r => {
      const icon = r.estado === 'aplicado' ? 'âœ…' : r.estado === 'descartada' ? 'â­' : 'ðŸ“‹';
      log(`  ${icon} [${r.analisis.score}] ${r.titulo} â€” ${r.empresa} | ${r.analisis.razon_corta}`);
    });

  const msg = `\u{1F3AF} <b>Job Loop x${LOOPS} completado</b>\nAnalizadas: ${analizadas.length} | Aplicadas: ${aplicadas.length}\n${aplicadas.map(r => `\u2705 ${r.titulo} \u2014 ${r.empresa}`).join('\n')}`;
  await sendTelegram(msg);

  log('\nâœ… Datos en: ' + JOBS_DIR);
}

main().catch(e => { console.error('âŒ Error:', e.message); process.exit(1); });

