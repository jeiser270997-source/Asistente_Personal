/**
 * check_aplicaciones.js — Verifica historial de aplicaciones en CT
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');

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
  await page.waitForTimeout(2000);
  await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
  await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
  await page.locator('button[type="submit"]').first().click().catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  console.log('Login:', page.url());

  // Ir al historial de aplicaciones
  await page.goto('https://candidato.co.computrabajo.com/candidate/applications', { waitUntil: 'load', timeout: 20000 });
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
