/**
 * debug_ct_login.js — Abre CT en modo visible y captura selectores del login
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';

async function main() {
  console.log('🔍 Abriendo Computrabajo en modo visible...');
  const browser = await chromium.launch({
    headless: false,  // VISIBLE para debuggear
    slowMo: 500,
  });
  const ctx  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO',
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();

  console.log('📡 Navegando a homepage para encontrar login real...');
  await page.goto('https://co.computrabajo.com', {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  await page.waitForTimeout(3000);

  // Capturar todos los links que contengan 'login', 'acceder', 'entrar', 'sesion'
  const loginLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).filter(a =>
      /login|acceder|entrar|sesion|candidato|registr/i.test(a.href + a.textContent)
    ).map(a => ({ text: a.textContent.trim().substring(0,40), href: a.href }));
  });
  console.log('\n🔗 Links de login encontrados:');
  loginLinks.forEach(l => console.log(' •', l.text, '->', l.href));

  // Screenshot homepage
  await page.screenshot({ path: require('node:path').join(__dirname, '..', 'data', 'jobs', 'debug_ct_home.png') });

  // Intentar encontrar y clickear el botón de login/acceder
  const loginUrl = loginLinks.find(l => /login|acceder|entrar/i.test(l.href + l.text))?.href;
  if (loginUrl) {
    console.log('\n➡️ Navegando a:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } else {
    // Intentar click en botón login de la home
    await page.click('a:has-text("Acceder"), a:has-text("Entrar"), a:has-text("Login"), button:has-text("Acceder")', { timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(3000);
  console.log('URL actual:', page.url());

  // Capturar todos los inputs de la página
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(el => ({
      type:        el.type,
      name:        el.name,
      id:          el.id,
      placeholder: el.placeholder,
      className:   el.className.substring(0, 60),
      visible:     el.offsetParent !== null,
    }));
  });

  console.log('\n📋 Inputs encontrados en la página:');
  inputs.forEach((inp, i) => console.log(`  [${i}]`, JSON.stringify(inp)));

  // Screenshot del estado actual
  const shot = path.join(__dirname, '..', 'data', 'jobs', 'debug_ct_login.png');
  await page.screenshot({ path: shot, fullPage: true });
  console.log('\n📸 Screenshot:', shot);

  // Intentar llenar con los inputs que encontremos
  console.log('\n🔑 Intentando login...');
  try {
    // Esperar cualquier input visible
    await page.waitForSelector('input:visible', { timeout: 5000 });

    // Buscar el campo de email/usuario
    const emailInput = page.locator('input').filter({ hasNot: page.locator('[type="password"]') }).first();
    const emailBox = await emailInput.boundingBox();
    console.log('Email input boundingBox:', emailBox);
    const emailAttr = await emailInput.evaluate(el => ({ type: el.type, name: el.name, id: el.id, placeholder: el.placeholder }));
    console.log('Email input attrs:', emailAttr);

    await emailInput.click();
    await page.waitForTimeout(500);
    await emailInput.fill(CT_EMAIL);
    console.log('✅ Email ingresado');

    const passInput = page.locator('input[type="password"]').first();
    await passInput.click();
    await page.waitForTimeout(300);
    await passInput.fill(CT_PASS);
    console.log('✅ Password ingresado');

    // Screenshot antes de submit
    const shot2 = path.join(__dirname, '..', 'data', 'jobs', 'debug_ct_filled.png');
    await page.screenshot({ path: shot2 });
    console.log('📸 Screenshot con campos llenos:', shot2);

    // Buscar botón submit
    const btn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Iniciar"), input[type="submit"]').first();
    const btnText = await btn.textContent().catch(() => 'n/a');
    console.log('Submit button texto:', btnText);
    await btn.click();
    await page.waitForTimeout(4000);

    const afterUrl = page.url();
    console.log('\n✅ URL post-login:', afterUrl);

    const shot3 = path.join(__dirname, '..', 'data', 'jobs', 'debug_ct_postlogin.png');
    await page.screenshot({ path: shot3 });
    console.log('📸 Screenshot post-login:', shot3);

    if (afterUrl.includes('login')) {
      console.log('❌ Sigue en login — credenciales incorrectas o captcha');
    } else {
      console.log('✅ LOGIN EXITOSO');
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    const errShot = path.join(__dirname, '..', 'data', 'jobs', 'debug_ct_error.png');
    await page.screenshot({ path: errShot });
    console.log('📸 Screenshot error:', errShot);
  }

  console.log('\n⏸ Esperando 5s para inspección manual...');
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('✅ Debug completado');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
