const { robustLogin } = require('./ct_login_helper');
/**
 * revisar_ofertas.js â€” Scrape y evalÃºa top 10 ofertas MedellÃ­n (sesiÃ³n CT)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const { askLLM } = require('../../lib/ai/llm_service');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

const SEARCHES = [
  'auxiliar-sistemas', 'soporte-tecnico-software', 'mesa-de-ayuda',
  'helpdesk', 'soporte-nivel-1', 'qa-junior', 'tester-manual-software',
];

const ES_MEDELLIN  = /medellin|antioquia|envigado|bello|itagui|sabaneta|rionegro/i;
const NO_MEDELLIN  = /bogota|bogot|cali|barranquilla|cartagena|bucaramanga|manizales|cucuta|pereira|funza|pasto|neiva|mosquera/i;

const PERFIL = `Jeiser Abraham Gutierrez Torres, QA Automation Junior (MedellÃ­n).
Skills: Playwright, JavaScript, Node.js, Git, GitHub Actions, Postman, SQL bÃ¡sico, SQLite, Linux.
Proyecto real: LifeOS (12 workflows GitHub Actions, scraping Playwright, APIs, Telegram bot, producciÃ³n).
Experiencia previa: Vigilante CCTV/medios tecnolÃ³gicos 2 aÃ±os (Coovisocial 2019-2021), Agente soporte Iberia/Amadeus-GDS (Sitel 2021).
Estudios: Bootcamp QA Automation 28 semanas CESDE (en curso), SENA Bases de Datos + Excel.
Disponible: tiempo completo, MedellÃ­n presencial o remoto.`;

// â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // OAuth puede tardar 6-8s â€” esperar hasta que salga de acceso/callback
  await page.waitForTimeout(6000);
  const ok = page.url().includes('candidate/home') || page.url().includes('candidato.co.computrabajo.com') && !page.url().includes('acceso');
  console.log(`  ðŸ”‘ Login CT: ${ok ? 'âœ… OK â€” ' + page.url().substring(0,55) : 'âš ï¸  ' + page.url().substring(0,60)}`);
}

// â”€â”€ Scrape lista de cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Scrape descripciÃ³n con Playwright â€” selector correcto box_detail â”€â”€
async function scrapeDesc(page, url) {
  try {
    await page.goto(url.split('#')[0], { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);

    return await page.evaluate(() => {
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();

      // Empresa y ciudad desde el tÃ­tulo
      const title = document.title || '';
      const empM = title.match(/ en ([^-]+) - /);
      const empresa = empM ? empM[1].trim().substring(0, 50) : '';
      const ciudadM = title.match(/ - (.+)$/);
      const lugar = ciudadM ? ciudadM[1].trim().substring(0, 50) : '';

      // Selector correcto confirmado por diagnÃ³stico: div.box_detail.fl.w100_m
      let desc = '';
      const boxEl = document.querySelector('.box_detail.fl') ||
                    document.querySelector('[class="box_detail fl w100_m"]') ||
                    document.querySelector('.box_border.menu_top');

      if (boxEl) {
        const fullText = clean(boxEl.innerText);
        // Extraer desde 'DescripciÃ³n de la oferta' hasta 'Aplicar' o 'Denunciar'
        const startMark = fullText.indexOf('DescripciÃ³n de la oferta');
        const endMark   = fullText.search(/\b(Aplicar|Denunciar|Ofertas similares|Acerca de)\b/);
        if (startMark > -1) {
          const end = endMark > startMark ? endMark : startMark + 3000;
          desc = fullText.substring(startMark + 'DescripciÃ³n de la oferta'.length, end).trim().substring(0, 2000);
        } else {
          desc = fullText.substring(0, 2000);
        }
      }

      // Salario â€” buscar patrÃ³n en el body
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

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 }, // MedellÃ­n
  });
  const page = await ctx.newPage();

  // Login y extraer cookies de sesiÃ³n
  console.log('\nðŸ” Iniciando sesiÃ³n en Computrabajo...');
  await robustLogin(page, CT_EMAIL, CT_PASS);

  // Extraer cookies ya no necesario â€” Playwright navega con sesiÃ³n activa

  // Recoger candidatas MedellÃ­n
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

  console.log(`\nâœ… ${candidatas.length} candidatas en MedellÃ­n/Ãrea. Evaluando las primeras 10...\n`);

  const evaluadas = [];
  for (const oferta of candidatas.slice(0, 10)) {
    process.stdout.write(`  ðŸ” ${oferta.titulo.substring(0, 55).padEnd(55)}... `);
    const det = await scrapeDesc(page, oferta.url);

    const empresa = det.empresa || oferta.empresa || 'N/A';
    const lugar   = det.lugar   || oferta.lugar   || 'MedellÃ­n';
    const salario = det.salario || 'N/A';

    const prompt = `EvalÃºa compatibilidad candidato-oferta (0-100). Solo JSON vÃ¡lido, sin texto extra.
CANDIDATO: ${PERFIL}
OFERTA: "${oferta.titulo}" | Empresa: ${empresa} | Ciudad: ${lugar} | Salario: ${salario}
DESCRIPCIÃ“N: ${det.desc.substring(0, 1500)}
Responde: {"score":<0-100>,"recomendacion":"APLICAR"|"REVISAR"|"DESCARTAR","razon":"<max 100 chars>","puntos_fuertes":["..."],"gaps":["..."]}`;

    // Debug: ver si la descripciÃ³n se extrajo
    const descLen = det.desc?.length || 0;
    if (descLen < 10) process.stdout.write(`[âš ï¸ desc vacÃ­a] `);

    let ev = { score: 0, recomendacion: 'REVISAR', razon: 'Error parsing LLM response', puntos_fuertes: [], gaps: [] };
    try {
      const sysPrompt = `Eres un evaluador de compatibilidad laboral. Responde SOLO con JSON vÃ¡lido, sin texto adicional.`;
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

    process.stdout.write(`Score: ${String(ev.score).padStart(3)} â†’ ${ev.recomendacion}\n`);
    evaluadas.push({ ...oferta, empresa, lugar, salario, ...ev });
    await page.waitForTimeout(300);
  }

  await browser.close();

  // Ordenar y mostrar
  evaluadas.sort((a, b) => b.score - a.score);

  console.log('\n' + 'â•'.repeat(72));
  console.log('  RANKING DE OFERTAS â€” MedellÃ­n / Ãrea Metro');
  console.log('â•'.repeat(72));

  evaluadas.forEach((o, i) => {
    const icon = o.recomendacion === 'APLICAR' ? 'ðŸŸ¢' : o.recomendacion === 'REVISAR' ? 'ðŸŸ¡' : 'ðŸ”´';
    console.log(`\n${icon} ${i+1}. [${o.score}/100] ${o.titulo}`);
    console.log(`    ðŸ¢ ${o.empresa}  |  ðŸ“ ${o.lugar}  |  ðŸ’° ${o.salario}`);
    console.log(`    ðŸ“ ${o.razon}`);
    if (o.puntos_fuertes?.length) console.log(`    âœ… ${o.puntos_fuertes.slice(0,3).join(' Â· ')}`);
    if (o.gaps?.length)           console.log(`    âš ï¸  ${o.gaps.slice(0,3).join(' Â· ')}`);
    console.log(`    ðŸ”— ${o.url}`);
  });

  const apl = evaluadas.filter(o => o.recomendacion === 'APLICAR').length;
  const rev = evaluadas.filter(o => o.recomendacion === 'REVISAR').length;
  const des = evaluadas.length - apl - rev;
  console.log(`\nðŸ“Š  ðŸŸ¢ ${apl} APLICAR  |  ðŸŸ¡ ${rev} REVISAR  |  ðŸ”´ ${des} DESCARTAR\n`);
})().catch(e => console.error('Fatal:', e.message));

