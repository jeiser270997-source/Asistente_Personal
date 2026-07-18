require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const LedgerStore = require('../../runtime/stores/LedgerStore');
const RE = require('../../lib/runtime/resume_engine');

const USER = process.env.ITAGUI_USER || 'jeiser270997@gmail.com';
const PASS = process.env.ITAGUI_PASS || 'A125%230a';
const LOGIN_URL = 'https://movilidad.transitoitagui.gov.co/portal-servicios/#/inicio-login';
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'cache', 'itagui');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

async function scrapeItagui(page) {
  log('Navigating to Itagui Login...');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Intentar login
  try {
    log('Ingresando credenciales...');
    
    log('Esperando carga inicial completa...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => log('Networkidle timeout alcanzado'));
    await page.waitForTimeout(5000);
    
    // Click "Ingresar" if it's a modal or separate route
    const ingresarBtn = await page.$('a:has-text("Ingresar"), button:has-text("Ingresar")');
    if (ingresarBtn) {
      log('Haciendo click en el botón Ingresar del menú...');
      await ingresarBtn.click();
      await page.waitForTimeout(3000);
    }
    
    const emailInput = await page.$('input[type="email"]') || await page.$('input[formcontrolname="email"]') || await page.$('input[name="email"]') || await page.$('input[type="text"]');
    const passInput = await page.$('input[type="password"]');

    if (!emailInput || !passInput) {
      log('No se encontraron los campos de login, volcando HTML...');
      const html = await page.content();
      fs.writeFileSync(path.join(DATA_DIR, 'debug_login.html'), html);
      await page.screenshot({ path: path.join(DATA_DIR, 'debug_login.png') });
      return null;
    }

    log('Campos encontrados. Buscando los visibles para llenar...');
    
    // Fill the first VISIBLE email input
    const emailInputs = await page.$$('input[type="email"], input[formcontrolname="email"], input[name="email"], input[type="text"]');
    for (const el of emailInputs) {
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(500);
        await el.fill(USER);
        break;
      }
    }
    
    // Fill the first VISIBLE password input
    const passInputs = await page.$$('input[type="password"]');
    let passFilled = null;
    for (const el of passInputs) {
      if (await el.isVisible()) {
        const html = await el.evaluate(n => n.outerHTML);
        log(`DEBUG: Campo de contraseña detectado: ${html}`);
        
        await el.focus();
        await page.waitForTimeout(1000); 
        
        const finalPass = PASS;
        
        // Simular pegado real a nivel sistema (usando execCommand si es posible) o asignación pura
        await page.evaluate((passText) => {
            const active = document.activeElement;
            active.removeAttribute('maxlength');
            active.maxLength = 100;
            
            // Intento 1: execCommand (simula Pegar)
            if (!document.execCommand('insertText', false, passText)) {
                // Intento 2: asignación directa si el navegador bloquea execCommand
                active.value = passText;
            }
            active.dispatchEvent(new Event('input', { bubbles: true }));
            active.dispatchEvent(new Event('change', { bubbles: true }));
        }, finalPass);

        await page.waitForTimeout(500);

        // Verificar que la clave se haya pegado completa
        const passLen = await el.evaluate(node => node.value ? node.value.length : 0);
        log(`Verificacion final: La clave insertada tiene ${passLen} caracteres.`);
        
        passFilled = el;
        break;
      }
    }
    await page.waitForTimeout(500);

    const submitBtn = await page.$('button[type="submit"], button:has-text("Iniciar sesión")');
    if (submitBtn) {
      log('Haciendo click en el botón de Iniciar sesión (submit)...');
      await submitBtn.click();
    } else {
      log('No se encontró el botón de submit, presionando Enter...');
      await passFilled.press('Enter');
    }
    
    log('Esperando redirección y carga del dashboard (tarda un poco)...');
    await page.waitForTimeout(15000);
    
    // Verificar si hay errores
    const errorMsg = await page.$('.alert, .error, .toast-message, mat-error, .text-danger');
    if (errorMsg) {
      const errorText = await errorMsg.innerText();
      log(`POSIBLE ERROR DE LOGIN: ${errorText}`);
    }
    
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
  RE.start('transito_itagui_scraper');
  log('═══════════════════════════════════════');
  log('TRANSITO ITAGUI SCRAPER');
  log('═══════════════════════════════════════');

  if (!PASS) {
    log('Falta ITAGUI_PASS en .env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const data = await scrapeItagui(page);
    if (!data) throw new Error('No se pudo extraer la info');

    RE.finish('transito_itagui_scraper', 'success', { run: true });
    log('Consulta completada (modo analisis)');
  } catch (err) {
    RE.finish('transito_itagui_scraper', 'error', { reason: err.message });
    log(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); process.exit(1); });
