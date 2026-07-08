/**
 * apply_eslop.js — Aplica a ESLOP SAS con manejo del /match/ redirect
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');

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
  await page.locator('button[type="submit"]').first().click().catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  console.log('Login:', page.url().includes('home') ? '✅ OK' : '⚠️ ' + page.url());

  // Ir a la oferta
  await page.goto(OFERTA, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);
  console.log('Oferta URL:', page.url());

  // Ver botones disponibles
  const botones = await page.evaluate(() =>
    [...document.querySelectorAll('button, a.btn, input[type="submit"]')]
      .map(b => b.textContent.trim().substring(0, 40) + ' | ' + (b.href || b.value || b.className).substring(0, 50))
      .filter(t => t.length > 5)
      .slice(0, 15)
  );
  console.log('\nBotones en la página de oferta:');
  botones.forEach(b => console.log(' -', b));

  // Click Postularme / Aplicar
  for (const txt of ['Postularme', 'Postular', 'Aplicar']) {
    try {
      await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 4000 });
      console.log(`\n✅ Click en "${txt}"`);
      await page.waitForTimeout(3000);
      console.log('URL tras click:', page.url());
      break;
    } catch {}
  }

  // Ver qué hay en la página actual (puede ser /match/)
  const pageInfo = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const botones = [...document.querySelectorAll('button, input[type="submit"]')]
      .map(b => b.textContent.trim().substring(0, 50))
      .filter(t => t.length > 2);
    return {
      url: location.href,
      texto: clean(document.body.innerText).substring(0, 500),
      botones,
    };
  });

  console.log('\nEstado actual:');
  console.log('URL:', pageInfo.url);
  console.log('Texto:', pageInfo.texto.substring(0, 300));
  console.log('Botones:', pageInfo.botones.join(' | '));

  // Si hay "Enviar mi HdV" u otro confirm, hacer click
  for (const txt of ['Enviar mi HdV', 'Enviar', 'Postularme', 'Confirmar', 'Aceptar']) {
    try {
      const btn = page.locator(`button:has-text("${txt}"), input[value="${txt}"]`).first();
      if (await btn.count() > 0) {
        await btn.click({ timeout: 4000 });
        await page.waitForTimeout(2000);
        console.log(`\n✅ Confirmado con "${txt}"`);
        const finalText = await page.evaluate(() => document.body.innerText.substring(0, 300));
        console.log('Resultado:', finalText.replace(/\s+/g, ' ').trim());
        break;
      }
    } catch {}
  }

  await page.screenshot({ path: path.join(__dirname, '..', 'diag_eslop_final.png') });
  await browser.close();
})().catch(e => console.error('Error:', e.message));
