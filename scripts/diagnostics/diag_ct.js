/**
 * diag_ct.js — Screenshot diagnóstico de oferta CT post-login
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';
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

  // ── Login ──────────────────────────────────────────────────────
  console.log('1. Navegando a acceso...');
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  console.log('2. Llenando credenciales...');
  await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
  await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });

  console.log('3. Enviando formulario...');
  await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(() => page.keyboard.press('Enter'));

  // Esperar lo que sea que pase
  await page.waitForTimeout(6000);
  console.log('4. URL post-login:', page.url());
  await page.screenshot({ path: path.join(__dirname, '..', 'diag_login.png'), fullPage: false });
  console.log('   → Screenshot guardado: diag_login.png');

  // ── Navegar a oferta ────────────────────────────────────────────
  console.log('5. Navegando a oferta...');
  await page.goto(OFERTA, { waitUntil: 'load', timeout: 25000 });
  await page.waitForTimeout(3000);
  console.log('6. URL oferta:', page.url());
  await page.screenshot({ path: path.join(__dirname, '..', 'diag_oferta.png'), fullPage: false });
  console.log('   → Screenshot guardado: diag_oferta.png');

  // ── Diagnóstico DOM ─────────────────────────────────────────────
  const info = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button, a[role="button"]')]
      .map(b => b.textContent.trim().substring(0, 40))
      .filter(t => t.length > 2)
      .slice(0, 15);

    const allClasses = [...document.querySelectorAll('[class]')]
      .map(el => el.className?.toString() || '')
      .filter(c => c.length > 2)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 30);

    const descEl   = document.querySelector('.descrip, [class*="descrip"]');
    const modalEl  = document.querySelector('[class*="modal"], [class*="overlay"], [class*="popup"]');
    const geoText  = document.body.innerText.includes('autorización') ? 'SÍ - modal geo presente' : 'NO';

    return {
      title: document.title,
      geoModal: geoText,
      descEl: descEl ? descEl.className + ' | text:' + descEl.innerText.substring(0, 100) : 'NOT FOUND',
      modalEl: modalEl ? modalEl.className.substring(0, 60) : 'NOT FOUND',
      buttons,
      classes: allClasses.filter(c => /descri|detall|oferta|job|content|box/i.test(c)),
    };
  });

  console.log('\n══ DIAGNÓSTICO ══');
  console.log('Title:   ', info.title);
  console.log('GeoModal:', info.geoModal);
  console.log('.descrip:', info.descEl);
  console.log('modal el:', info.modalEl);
  console.log('Botones: ', info.buttons.join(' | '));
  console.log('Clases relevantes:');
  info.classes.forEach(c => console.log('  -', c));

  await browser.close();
})().catch(e => console.error('Fatal:', e.message));
