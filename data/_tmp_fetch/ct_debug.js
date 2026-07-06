// Debug: ver qué ve Playwright en Computrabajo
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();

  // Test 1: URL directa de búsqueda
  console.log('Test 1: URL directa...');
  await page.goto('https://co.computrabajo.com/jobs-of-qa', { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: path.join(__dirname, '..', 'data', 'jobs', 'ct_debug1.png') });
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  const links1 = await page.$$eval('a[href*="oferta"]', els => els.slice(0,5).map(e => ({text: e.textContent.trim().substring(0,60), href: e.href})));
  console.log('Links con oferta:', links1);

  // Test 2: Página de búsqueda
  console.log('\nTest 2: search...');
  await page.goto('https://co.computrabajo.com/jobs?q=QA', { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: path.join(__dirname, '..', 'data', 'jobs', 'ct_debug2.png') });
  console.log('URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body:', bodyText);

  // Test 3: URL formato alternativo
  console.log('\nTest 3: formato alternativo...');
  await page.goto('https://co.computrabajo.com/trabajo-de-qa', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, '..', 'data', 'jobs', 'ct_debug3.png') });
  const bodyText3 = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body3:', bodyText3);

  await browser.close();
  console.log('\nScreenshots en data/jobs/ct_debug*.png');
}

main().catch(e => console.error('ERROR:', e.message));
