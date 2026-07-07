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
const { askLLM } = require('../lib/ai/llm_service');

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
    return { score: 50, recomendar_aplicar: true, razon: 'Score no calculado' };
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
