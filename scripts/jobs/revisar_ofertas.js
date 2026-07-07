/**
 * revisar_ofertas.js — Scrape y evalúa top 10 ofertas Medellín (sesión CT)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const { askLLM } = require('../lib/ai/llm_service');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';

const SEARCHES = [
  'auxiliar-sistemas', 'soporte-tecnico-software', 'mesa-de-ayuda',
  'helpdesk', 'soporte-nivel-1', 'qa-junior', 'tester-manual-software',
];

const ES_MEDELLIN  = /medellin|antioquia|envigado|bello|itagui|sabaneta|rionegro/i;
const NO_MEDELLIN  = /bogota|bogot|cali|barranquilla|cartagena|bucaramanga|manizales|cucuta|pereira|funza|pasto|neiva|mosquera/i;

const PERFIL = `Jeiser Abraham Gutierrez Torres, QA Automation Junior (Medellín).
Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL básico, SQLite, Linux.
Proyecto real: LifeOS (12 workflows GitHub Actions, scraping Playwright, APIs, Telegram bot, producción).
Experiencia previa: Vigilante CCTV/medios tecnológicos 2 años (Coovisocial 2019-2021), Agente soporte Iberia/Amadeus-GDS (Sitel 2021).
Estudios: Bootcamp QA Automation 28 semanas CESDE (en curso), SENA Bases de Datos + Excel.
Disponible: tiempo completo, Medellín presencial o remoto.`;

// ── Login ───────────────────────────────────────────────────────
async function loginCT(page) {
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const emailSel = page.locator('#Email, input[name="Email"]').first();
  await emailSel.fill(CT_EMAIL, { timeout: 10000 });
  const passSel = page.locator('#password, input[name="Password"]').first();
  await passSel.fill(CT_PASS, { timeout: 5000 });

  // Submit
  const submitBtn = page.locator('button[type="submit"]').first();
  await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(async () => {
    await page.keyboard.press('Enter');
  });

  // OAuth puede tardar 6-8s — esperar hasta que salga de acceso/callback
  await page.waitForTimeout(6000);
  const ok = page.url().includes('candidate/home') || page.url().includes('candidato.co.computrabajo.com') && !page.url().includes('acceso');
  console.log(`  🔑 Login CT: ${ok ? '✅ OK — ' + page.url().substring(0,55) : '⚠️  ' + page.url().substring(0,60)}`);
}

// ── Scrape lista de cards ───────────────────────────────────────
async function scrapeCards(page, q) {
  const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate&l=medellin`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const results = [];
    document.querySelectorAll('article').forEach(card => {
      const a = card.querySelector('h2 a, h3 a, a[href*="oferta"]');
      if (!a?.href) return;
      const titulo  = (a.textContent || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
      const empresa = card.querySelector('[class*="company"], [class*="employer"]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const lugar   = card.querySelector('[class*="city"], [class*="location"]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (titulo.length > 3) results.push({ titulo, empresa: empresa.substring(0, 50), lugar, url: a.href });
    });
    return results;
  });
}

// ── Scrape descripción con Playwright — selector correcto box_detail ──
async function scrapeDesc(page, url) {
  try {
    await page.goto(url.split('#')[0], { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);

    return await page.evaluate(() => {
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();

      // Empresa y ciudad desde el título
      const title = document.title || '';
      const empM = title.match(/ en ([^-]+) - /);
      const empresa = empM ? empM[1].trim().substring(0, 50) : '';
      const ciudadM = title.match(/ - (.+)$/);
      const lugar = ciudadM ? ciudadM[1].trim().substring(0, 50) : '';

      // Selector correcto confirmado por diagnóstico: div.box_detail.fl.w100_m
      let desc = '';
      const boxEl = document.querySelector('.box_detail.fl') ||
                    document.querySelector('[class="box_detail fl w100_m"]') ||
                    document.querySelector('.box_border.menu_top');

      if (boxEl) {
        const fullText = clean(boxEl.innerText);
        // Extraer desde 'Descripción de la oferta' hasta 'Aplicar' o 'Denunciar'
        const startMark = fullText.indexOf('Descripción de la oferta');
        const endMark   = fullText.search(/\b(Aplicar|Denunciar|Ofertas similares|Acerca de)\b/);
        if (startMark > -1) {
          const end = endMark > startMark ? endMark : startMark + 3000;
          desc = fullText.substring(startMark + 'Descripción de la oferta'.length, end).trim().substring(0, 2000);
        } else {
          desc = fullText.substring(0, 2000);
        }
      }

      // Salario — buscar patrón en el body
      const bodyText = document.body.innerText;
      const salM = bodyText.match(/\$[\s\d.,]+(?:mensual|COP)?/i) ||
                   bodyText.match(/A convenir/);
      const salario = salM ? salM[0].trim().substring(0, 40) : '';

      return { empresa, lugar, salario, desc };
    });
  } catch (e) {
    return { empresa: '', lugar: '', salario: '', desc: '' };
  }
}

// ── Main ────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 }, // Medellín
  });
  const page = await ctx.newPage();

  // Login y extraer cookies de sesión
  console.log('\n🔐 Iniciando sesión en Computrabajo...');
  await loginCT(page);

  // Extraer cookies ya no necesario — Playwright navega con sesión activa

  // Recoger candidatas Medellín
  const seen = new Set();
  const candidatas = [];

  for (const q of SEARCHES) {
    const cards = await scrapeCards(page, q);
    for (const c of cards) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      if (NO_MEDELLIN.test(c.url) && !ES_MEDELLIN.test(c.url)) continue;
      candidatas.push(c);
    }
    if (candidatas.length >= 30) break;
  }

  console.log(`\n✅ ${candidatas.length} candidatas en Medellín/Área. Evaluando las primeras 10...\n`);

  const evaluadas = [];
  for (const oferta of candidatas.slice(0, 10)) {
    process.stdout.write(`  🔍 ${oferta.titulo.substring(0, 55).padEnd(55)}... `);
    const det = await scrapeDesc(page, oferta.url);

    const empresa = det.empresa || oferta.empresa || 'N/A';
    const lugar   = det.lugar   || oferta.lugar   || 'Medellín';
    const salario = det.salario || 'N/A';

    const prompt = `Evalúa compatibilidad candidato-oferta (0-100). Solo JSON válido, sin texto extra.
CANDIDATO: ${PERFIL}
OFERTA: "${oferta.titulo}" | Empresa: ${empresa} | Ciudad: ${lugar} | Salario: ${salario}
DESCRIPCIÓN: ${det.desc.substring(0, 1500)}
Responde: {"score":<0-100>,"recomendacion":"APLICAR"|"REVISAR"|"DESCARTAR","razon":"<max 100 chars>","puntos_fuertes":["..."],"gaps":["..."]}`;

    // Debug: ver si la descripción se extrajo
    const descLen = det.desc?.length || 0;
    if (descLen < 10) process.stdout.write(`[⚠️ desc vacía] `);

    let ev = { score: 0, recomendacion: 'REVISAR', razon: 'Error parsing LLM response', puntos_fuertes: [], gaps: [] };
    try {
      const sysPrompt = `Eres un evaluador de compatibilidad laboral. Responde SOLO con JSON válido, sin texto adicional.`;
      const msg = await askLLM(sysPrompt, [{ role: 'user', content: prompt }]);
      const raw = typeof msg === 'string' ? msg : (msg?.content || '');
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        ev = JSON.parse(m[0]);
      } else {
        ev.razon = 'No JSON en respuesta: ' + raw.substring(0, 60);
      }
    } catch (e) {
      ev.razon = 'Error LLM: ' + e.message.substring(0, 40);
    }

    process.stdout.write(`Score: ${String(ev.score).padStart(3)} → ${ev.recomendacion}\n`);
    evaluadas.push({ ...oferta, empresa, lugar, salario, ...ev });
    await page.waitForTimeout(300);
  }

  await browser.close();

  // Ordenar y mostrar
  evaluadas.sort((a, b) => b.score - a.score);

  console.log('\n' + '═'.repeat(72));
  console.log('  RANKING DE OFERTAS — Medellín / Área Metro');
  console.log('═'.repeat(72));

  evaluadas.forEach((o, i) => {
    const icon = o.recomendacion === 'APLICAR' ? '🟢' : o.recomendacion === 'REVISAR' ? '🟡' : '🔴';
    console.log(`\n${icon} ${i+1}. [${o.score}/100] ${o.titulo}`);
    console.log(`    🏢 ${o.empresa}  |  📍 ${o.lugar}  |  💰 ${o.salario}`);
    console.log(`    📝 ${o.razon}`);
    if (o.puntos_fuertes?.length) console.log(`    ✅ ${o.puntos_fuertes.slice(0,3).join(' · ')}`);
    if (o.gaps?.length)           console.log(`    ⚠️  ${o.gaps.slice(0,3).join(' · ')}`);
    console.log(`    🔗 ${o.url}`);
  });

  const apl = evaluadas.filter(o => o.recomendacion === 'APLICAR').length;
  const rev = evaluadas.filter(o => o.recomendacion === 'REVISAR').length;
  const des = evaluadas.length - apl - rev;
  console.log(`\n📊  🟢 ${apl} APLICAR  |  🟡 ${rev} REVISAR  |  🔴 ${des} DESCARTAR\n`);
})().catch(e => console.error('Fatal:', e.message));
