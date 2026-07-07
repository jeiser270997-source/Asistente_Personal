/**
 * job_loop.js — Pipeline completo de Job Hunter
 * Loop x5: Scrape → Analyze → Tailor CV → Apply
 * 
 * Uso: node scripts/job_loop.js [--loops=5] [--min-score=60] [--dry-run]
 *   --dry-run: analiza y genera CVs pero NO aplica
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs    = require('node:fs');
const path  = require('node:path');
const { execSync, spawn } = require('node:child_process');
const { askLLM } = require('../lib/ai/llm_service');
const { chromium } = require('playwright');

const BASE_DIR  = path.resolve(__dirname, '..');
const JOBS_DIR  = path.join(BASE_DIR, 'data', 'jobs');
const CV_BASE   = path.join(JOBS_DIR, 'cv_base.md');
const CV_OUT    = path.join(JOBS_DIR, 'cv_tailored');
const APPLY_LOG = path.join(JOBS_DIR, 'aplicaciones.json');

const LOOPS     = parseInt((process.argv.find(a => a.startsWith('--loops=')) || '--loops=5').split('=')[1]);
const MIN_SCORE = parseInt((process.argv.find(a => a.startsWith('--min-score=')) || '--min-score=60').split('=')[1]);
const DRY_RUN   = process.argv.includes('--dry-run');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';
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
  } catch {}
}

// ─── SCRAPE LISTA DE OFERTAS ──────────────────────────────────
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
      await page.waitForTimeout(2500);
      const offers = await page.evaluate((lbl) => {
        const results = [];
        const clean = s => (s || '').replace(/\s+/g, ' ').trim();
        // Palabras que indican que NO es tech (calidad industrial/construcción)
        const NON_TECH = /andamio|ensamblador|eléctric|construcci|andamier|soldad|mecáni|operari|producción|manufactura|planta|textil|costura|bodega/i;
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
      log(`  [scrape] ⚠ ${q}: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(1000);
  }
  await browser.close();

  // Deduplicar
  const seen = new Set();
  return allOffers.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });
}

// ─── SCRAPE DESCRIPCIÓN COMPLETA ──────────────────────────────
async function scrapeDescripcion(url, browser) {
  const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
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

// ─── ANALIZAR COMPATIBILIDAD ──────────────────────────────────
async function analizarOferta(oferta, cvBase) {
  const desc = oferta.descripcion || oferta.titulo;
  const prompt = `Eres un experto en reclutamiento tech en Colombia. Analiza la compatibilidad entre este candidato y la oferta.

CANDIDATO — Jeiser Gutierrez:
- QA Automation Junior en formación (CESDE bootcamp 2026, 28 semanas)
- Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL básico
- Proyecto real: LifeOS (sistema autónomo con 11 workflows, scraping, LLM, SQLite)
- Sin experiencia laboral formal en QA
- Disponible: tiempo completo o medio tiempo, Medellín + remoto

OFERTA: ${oferta.titulo} | ${oferta.empresa} | ${oferta.lugar}
DESCRIPCIÓN: ${desc.substring(0, 1500)}

Responde SOLO en JSON válido:
{
  "score": <0-100>,
  "nivel_requerido": "junior|mid|senior",
  "skills_match": ["skill1", "skill2"],
  "skills_gap": ["gap1", "gap2"],
  "salario_estimado": "$X.XXX.000 - $Y.YYY.000",
  "modalidad": "remoto|presencial|hibrido",
  "recomendar": true/false,
  "razon_corta": "una frase",
  "tip_postulacion": "qué enfatizar en la carta"
}`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { score: 50, recomendar: true, razon_corta: 'Análisis manual requerido', skills_match: [], skills_gap: [] };
  }
}

// ─── TAILORING CV ─────────────────────────────────────────────
async function tailorCV(oferta, analisis, cvBase) {
  const prompt = `Personaliza este CV para la oferta específica. Usa el análisis previo para saber qué enfatizar.

OFERTA: ${oferta.titulo} — ${oferta.empresa}
SKILLS A DESTACAR: ${(analisis.skills_match || []).join(', ')}
TIP: ${analisis.tip_postulacion || ''}
DESCRIPCIÓN: ${(oferta.descripcion || oferta.titulo).substring(0, 1000)}

CV BASE:
${cvBase}

INSTRUCCIONES:
1. Añade un RESUMEN PROFESIONAL de 2-3 líneas específico para esta oferta
2. Reordena skills: primero las que piden, luego las demás
3. Ajusta LifeOS project para enfatizar lo relevante para esta oferta
4. Mantén TODO verídico — no inventes nada
5. Formato Markdown limpio Harvard — máx 1 página al imprimir
6. Devuelve SOLO el CV en Markdown`;

  const res = await askLLM(prompt, [], 0.3);
  return (res.content || '').replace(/```markdown|```/g, '').trim();
}

// ─── APLICAR OFERTA ───────────────────────────────────────────
async function aplicar(oferta, browser) {
  if (DRY_RUN) { log('  [dry-run] Saltando aplicación'); return { exito: false, razon: 'dry-run' }; }

  const ctx  = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' });
  const page = await ctx.newPage();
  try {
    // Login
    await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.fill('#Email, input[name="Email"]', CT_EMAIL, { force: true });
    await page.fill('#password, input[name="Password"]', CT_PASS, { force: true });
    await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Navegar a oferta
    await page.goto(oferta.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Botón postularme
    const btnSelectors = [
      'button:has-text("Postularme")', 'button:has-text("Postular")',
      'a:has-text("Postularme")', 'a:has-text("Postular")',
      '.js-apply-btn', '[data-qa="applyButton"]',
    ];
    let clicked = false;
    for (const sel of btnSelectors) {
      try { await page.click(sel, { timeout: 2000 }); clicked = true; break; } catch {}
    }

    if (!clicked) {
      await ctx.close();
      return { exito: false, razon: 'Botón postularme no encontrado' };
    }

    await page.waitForTimeout(3000);
    const confirmado = await page.evaluate(() =>
      /postul|envi|éxito|registrad|aplicac/i.test(document.body.innerText)
    );

    const shot = path.join(JOBS_DIR, `apply_${oferta.id}_${Date.now()}.png`);
    await page.screenshot({ path: shot });
    await ctx.close();
    return { exito: confirmado, razon: confirmado ? 'Postulación enviada' : 'No confirmado', screenshot: shot };
  } catch (e) {
    await ctx.close();
    return { exito: false, razon: e.message.substring(0, 80) };
  }
}

// ─── MAIN LOOP ────────────────────────────────────────────────
async function main() {
  ensureDir(CV_OUT);
  const cvBase = fs.readFileSync(CV_BASE, 'utf8');
  const aplicaciones = fs.existsSync(APPLY_LOG) ? JSON.parse(fs.readFileSync(APPLY_LOG, 'utf8')) : [];
  const yaAplicadas = new Set(aplicaciones.map(a => a.oferta_id || a.url));

  log('═══════════════════════════════════════════════════');
  log(`🚀 JOB LOOP x${LOOPS} | min-score: ${MIN_SCORE} | ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  log('═══════════════════════════════════════════════════');

  const resultados = [];
  const browser = await chromium.launch({ headless: true });

  for (let loop = 1; loop <= LOOPS; loop++) {
    log(`\n━━━ LOOP ${loop}/${LOOPS} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // PASO 1: Scrape
    log('📡 [1/4] Scraping Computrabajo...');
    const ofertas = await scrapeOfertasList();
    const UBICACIONES_OK  = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|teletrabajo/i;
    const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa marta/i;

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
      log(`\n  📋 "${oferta.titulo}" — ${oferta.empresa}`);

      // PASO 2: Scrape descripción completa
      log('  🔍 [2/4] Scrapeando descripción...');
      oferta.descripcion = await scrapeDescripcion(oferta.url, browser);

      // PASO 3: Analizar
      log('  🧠 [3/4] Analizando compatibilidad...');
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
        log(`  ✂️  [4/4] Tailoring CV (score ${analisis.score} ≥ ${MIN_SCORE})...`);
        try {
          const cvTailored = await tailorCV(oferta, analisis, cvBase);
          const slug = oferta.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 35);
          const cvPath = path.join(CV_OUT, `cv_${slug}_loop${loop}.md`);
          fs.writeFileSync(cvPath, cvTailored, 'utf8');
          registro.cv_path = cvPath;
          log(`       CV guardado: ${path.basename(cvPath)}`);

          // Aplicar
          log('  🚀  Aplicando...');
          const resultado = await aplicar(oferta, browser);
          registro.estado = resultado.exito ? 'aplicado' : `error_apply: ${resultado.razon}`;
          registro.screenshot = resultado.screenshot;

          if (resultado.exito) {
            yaAplicadas.add(oferta.id);
            log(`       ✅ APLICADO`);
            await sendTelegram(`✅ <b>Aplicación enviada</b>\n${oferta.titulo} — ${oferta.empresa}\nScore: ${analisis.score}/100\n<a href="${oferta.url}">Ver oferta</a>`);
          } else {
            log(`       ⚠ No confirmado: ${resultado.razon}`);
          }
        } catch (e) {
          log(`  ⚠ Error tailoring/apply: ${e.message.substring(0, 80)}`);
          registro.estado = 'error: ' + e.message.substring(0, 60);
        }
      } else {
        log(`  ⏭  Descartada (score ${analisis.score} < ${MIN_SCORE} o recomendar=${analisis.recomendar})`);
        registro.estado = 'descartada';
      }

      resultados.push(registro);
      aplicaciones.push(registro);
      fs.writeFileSync(APPLY_LOG, JSON.stringify(aplicaciones, null, 2));
    }

    // Pausa entre loops
    if (loop < LOOPS) {
      log(`\n  ⏸ Pausa 5s entre loops...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await browser.close();

  // RESUMEN FINAL
  const aplicadas  = resultados.filter(r => r.estado === 'aplicado');
  const analizadas = resultados.filter(r => r.analisis);
  const descartadas = resultados.filter(r => r.estado === 'descartada');

  log('\n═══════════════════════════════════════════════════');
  log('📊 RESUMEN FINAL');
  log('═══════════════════════════════════════════════════');
  log(`Total analizadas: ${analizadas.length}`);
  log(`✅ Aplicadas:     ${aplicadas.length}`);
  log(`⏭ Descartadas:   ${descartadas.length}`);
  log('\nTop ofertas por score:');
  resultados
    .filter(r => r.analisis)
    .sort((a, b) => (b.analisis.score||0) - (a.analisis.score||0))
    .slice(0, 8)
    .forEach(r => {
      const icon = r.estado === 'aplicado' ? '✅' : r.estado === 'descartada' ? '⏭' : '📋';
      log(`  ${icon} [${r.analisis.score}] ${r.titulo} — ${r.empresa} | ${r.analisis.razon_corta}`);
    });

  const msg = `🎯 <b>Job Loop x${LOOPS} completado</b>
Analizadas: ${analizadas.length} | Aplicadas: ${aplicadas.length}
${aplicadas.map(r => `✅ ${r.titulo} — ${r.empresa}`).join('\n')}`;
  await sendTelegram(msg);

  log('\n✅ Datos en: ' + JOBS_DIR);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
