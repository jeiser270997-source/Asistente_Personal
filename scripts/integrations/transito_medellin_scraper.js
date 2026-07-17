require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const RE = require('../../lib/runtime/resume_engine');

const USER = process.env.MEDELLIN_USER || process.env.USER_CC;
const PASS = process.env.MEDELLIN_PASS;
const LOGIN_URL = 'https://www.medellin.gov.co/irj/portal/medellin/servicios_digitales_movilidad';
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'cache', 'medellin');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

async function scrapeMedellin(page) {
  log('Navigating to Medellin Movilidad...');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  try {
    log('Ingresando credenciales...');
    
    // Look for login form elements, handling possible frames or overlays
    const userInput = await page.$('input[name="j_username"]') || await page.$('input[type="text"]');
    const passInput = await page.$('input[name="j_password"]') || await page.$('input[type="password"]');

    if (!userInput || !passInput) {
      log('No se encontraron los campos de login, volcando HTML...');
      const html = await page.content();
      fs.writeFileSync(path.join(DATA_DIR, 'debug_login.html'), html);
      await page.screenshot({ path: path.join(DATA_DIR, 'debug_login.png') });
      return null;
    }

    log('Campos encontrados. Llenando...');
    await userInput.fill(USER);
    await passInput.fill(PASS);
    await page.waitForTimeout(500);

    const btns = await page.$$('input[type="submit"], button');
    let loginBtn = null;
    for (const btn of btns) {
      const text = await btn.innerText();
      const val = await btn.getAttribute('value');
      const btnText = (text || val || '').toLowerCase();
      if (btnText.includes('ingresar') || btnText.includes('iniciar') || btnText.includes('entrar') || btnText.includes('login')) {
        loginBtn = btn;
        break;
      }
    }

    if (!loginBtn) {
      await passInput.press('Enter');
    } else {
      await loginBtn.click();
    }
    
    log('Esperando redirección...');
    await page.waitForTimeout(8000);
    
    const modales = await page.$$('button:has-text("Aceptar"), button:has-text("Cerrar"), button:has-text("OK")');
    for (let i = 0; i < modales.length; i++) {
        try { await modales[i].click(); } catch(e){}
    }
    await page.waitForTimeout(2000);

    log('Extrayendo informacion visible de multas...');
    await page.screenshot({ path: path.join(DATA_DIR, 'dashboard.png') });

    const pageText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(DATA_DIR, 'dashboard_text.txt'), pageText);
    
    log('Datos guardados en dashboard_text.txt para analisis inicial');
    return { text: pageText };
  } catch (err) {
    log(`Error durante el scraping: ${err.message}`);
    return null;
  }
}

async function main() {
  ensureDir();
  RE.start('transito_medellin_scraper');
  log('═══════════════════════════════════════');
  log('TRANSITO MEDELLIN SCRAPER');
  log('═══════════════════════════════════════');

  if (!PASS) {
    log('Falta MEDELLIN_PASS en .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: {
        'Accept-Language': 'es-CO,es;q=0.9',
        'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"'
    }
  });
  const page = await context.newPage();
  
  try {
    const data = await scrapeMedellin(page);
    if (!data) throw new Error('No se pudo extraer la info');

    RE.finish('transito_medellin_scraper', 'success', { run: true });
    log('Consulta completada (modo analisis)');
  } catch (err) {
    RE.finish('transito_medellin_scraper', 'error', { reason: err.message });
    log(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); process.exit(1); });
