/**
 * find_aplicaciones.js — Encuentra la URL del historial de aplicaciones CT
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

  // Desde el home, buscar todos los links del menú
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')]
      .map(a => ({ text: a.textContent.trim().substring(0, 40), href: a.href }))
      .filter(l => l.href.includes('candidato') && l.text.length > 2)
      .filter((v, i, a) => a.findIndex(x => x.href === v.href) === i)
      .slice(0, 30);
  });

  console.log('Links del perfil CT:');
  links.forEach(l => console.log(`  ${l.text.padEnd(35)} → ${l.href}`));

  // También buscar link "aplicaciones", "postulaciones", "mis ofertas"
  const appLink = links.find(l =>
    /aplica|postula|mis ofertas|inscri/i.test(l.text) ||
    /aplica|postula|inscri/i.test(l.href)
  );
  if (appLink) {
    console.log('\n✅ Link de aplicaciones encontrado:', appLink);
    await page.goto(appLink.href, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);
    const texto = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 2000));
    console.log('\n══ CONTENIDO ══\n', texto);
  }

  await browser.close();
})().catch(e => console.error('Error:', e.message));
