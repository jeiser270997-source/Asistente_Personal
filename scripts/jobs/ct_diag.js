require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const fs = require('node:fs');

const EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const PASS  = process.env.COMPUTRABAJO_PASS;

async function diagnose() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO', viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  fs.mkdirSync('data/logs', { recursive: true });

  console.log('→ Navegando a login...');
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'data/logs/ct_diag_acceso.png' });
  console.log('URL:', page.url());

  const inputs = await page.$$eval('input, button', els => els.map(e => ({
    tag: e.tagName, id: e.id, name: e.name, type: e.type || e.getAttribute('type'),
    placeholder: e.placeholder || '', text: e.textContent?.trim().substring(0,30),
    class: e.className?.substring(0, 60), visible: e.offsetParent !== null
  })));
  console.log('Elementos interactivos:', JSON.stringify(inputs, null, 2));

  // Intentar rellenar email
  const emailSel = inputs.find(i => i.type === 'email' || i.type === 'text' && i.placeholder.toLowerCase().includes('mail'));
  if (emailSel) {
    console.log('\n→ Rellenando email con selector:', emailSel.id || emailSel.name || emailSel.placeholder);
    const sel = emailSel.id ? `#${emailSel.id}` : `input[placeholder="${emailSel.placeholder}"]`;
    await page.fill(sel, EMAIL);
    await page.screenshot({ path: 'data/logs/ct_diag_email_filled.png' });

    // Buscar botón continuar
    const btns = await page.$$eval('button, input[type="submit"], a.btn', els =>
      els.map(e => ({ tag: e.tagName, id: e.id, text: e.textContent?.trim(), type: e.type }))
    );
    console.log('Botones:', JSON.stringify(btns, null, 2));

    // Click continuar
    try {
      await page.click('button[type="submit"], #continueWithMailButton, button:has-text("Continuar"), button:has-text("Siguiente")', { timeout: 5000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'data/logs/ct_diag_paso2.png' });
      console.log('→ Paso 2 URL:', page.url());

      const inputs2 = await page.$$eval('input', els => els.map(e => ({
        id: e.id, name: e.name, type: e.type, placeholder: e.placeholder, visible: e.offsetParent !== null
      })));
      console.log('Inputs paso 2:', JSON.stringify(inputs2, null, 2));
    } catch(e) { console.log('Click continuar falló:', e.message.substring(0,80)); }
  } else {
    console.log('⚠ No se encontró input de email. Ver screenshot.');
  }

  await page.waitForTimeout(10000);
  await browser.close();
}

diagnose().catch(e => console.error('FATAL:', e.message));
