/**
 * diag_ct2.js — Encuentra el elemento con la descripción real de la oferta
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;
const OFERTA   = 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405';

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
  await page.waitForTimeout(2000);
  await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
  await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
  await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  console.log('Login URL:', page.url());

  // Oferta
  await page.goto(OFERTA, { waitUntil: 'load', timeout: 25000 });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();

    // 1. Los 10 elementos con texto más largo (excluir scripts, styles, head)
    const allEls = [...document.querySelectorAll('div, p, section, article, span')];
    const byLength = allEls
      .map(el => ({ tag: el.tagName, cls: (el.className || '').toString().substring(0, 60), text: clean(el.innerText || '') }))
      .filter(e => e.text.length > 100 && e.text.length < 5000)
      .sort((a, b) => b.text.length - a.text.length)
      .slice(0, 8);

    // 2. Elementos con clases que incluyan 'box_detail', 'fs14', 'content'
    const boxDetails = [...document.querySelectorAll('[class*="box_detail"], [class*="fs14 lh"], [class*="jobDesc"], [class*="offer"]')]
      .map(el => ({ cls: (el.className || '').toString().substring(0, 60), text: clean(el.innerText || '').substring(0, 200) }))
      .filter(e => e.text.length > 30)
      .slice(0, 6);

    // 3. Todo el innerText de la página (para referencia)
    const fullText = clean(document.body.innerText).substring(0, 3000);

    return { byLength, boxDetails, fullText };
  });

  console.log('\n═══ TOP ELEMENTOS POR LONGITUD DE TEXTO ═══');
  info.byLength.forEach((e, i) => {
    console.log(`\n${i+1}. <${e.tag}> class="${e.cls}"`);
    console.log(`   [${e.text.length}c] ${e.text.substring(0, 200)}`);
  });

  console.log('\n═══ BOX_DETAIL Y SIMILARES ═══');
  info.boxDetails.forEach(e => {
    console.log(`\nclass="${e.cls}"`);
    console.log(`  ${e.text}`);
  });

  console.log('\n═══ TEXTO COMPLETO DE LA PÁGINA (primeros 1500c) ═══');
  console.log(info.fullText.substring(0, 1500));

  await browser.close();
})().catch(e => console.error('Fatal:', e.message));
