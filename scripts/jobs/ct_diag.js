require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');
const fs = require('node:fs');

const CV_EDIT_URL = 'https://candidato.co.computrabajo.com/candidate/cv/edit/';

async function killPopup(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.popup, .modal, [class*="popup"], [premium-candidate-popup], [home-candidate-popup]')
      .forEach(el => el.remove());
  });
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO', viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  fs.mkdirSync('data/logs', { recursive: true });

  await robustLogin(page, process.env.COMPUTRABAJO_EMAIL, process.env.COMPUTRABAJO_PASS);
  await page.waitForTimeout(2000);

  // Navegar directo al editor del CV
  console.log('Navegando al editor del CV...');
  await page.goto(CV_EDIT_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await killPopup(page);
  await page.waitForTimeout(1000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'data/logs/ct_cv_edit.png', fullPage: true });

  // Mapear secciones editables
  const secciones = await page.$$eval(
    'section, [class*="section"], [class*="block"], .cv-section',
    els => els.map(e => ({ class: e.className?.substring(0,60), id: e.id, text: e.textContent?.trim().substring(0,80) }))
  ).catch(() => []);
  console.log('\n=== SECCIONES ===');
  secciones.slice(0, 20).forEach(s => console.log(`  [${s.id || s.class?.substring(0,30)}] ${s.text?.substring(0,60)}`));

  const btns = await page.$$eval(
    'a[href*="edit"], a[href*="add"], button, a[class*="edit"], a[class*="add"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0,50), href: e.href || '', class: e.className?.substring(0,40) }))
              .filter(e => e.text)
  ).catch(() => []);
  console.log('\n=== BOTONES ===');
  btns.slice(0, 30).forEach(b => console.log(`  [${b.tag}] "${b.text}" → ${b.href.substring(0,80)}`));

  await page.waitForTimeout(15000);
  await browser.close();
}

run().catch(e => console.error('FATAL:', e.message));
