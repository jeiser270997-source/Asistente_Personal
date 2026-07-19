// scripts/jobs/computrabajo_apply.js - v3 bulletproof (FIX-011)
require("dotenv").config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require("playwright");
const fs = require('node:fs');
const { PATHS } = require('../../lib/data/paths');
const { robustLogin } = require('./ct_login_helper');

const STATE_PATH = PATHS.COMPUTRABAJO_STATE;

function log(msg) {
  console.log(`[APPLY ${new Date().toISOString()}] ${msg}`);
}

async function applyToOfferSafe(oferta) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  // Intentar cargar sesión guardada antes de crear contexto (FIX-011)
  const hasSavedState = fs.existsSync(STATE_PATH);
  const contextOpts = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    locale: "es-CO",
  };
  if (hasSavedState) {
    contextOpts.storageState = STATE_PATH;
    log('📂 Cargando cookies de sesión persistida...');
  }

  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  try {
    // 1. Ejecutar autenticación (saltará si la sesión es válida)
    const loginOk = await robustLogin(page, process.env.COMPUTRABAJO_EMAIL, process.env.COMPUTRABAJO_PASS);
    if (!loginOk) throw new Error('No se pudo validar sesión en Computrabajo');

    log(`Navegando a la oferta: ${oferta.titulo}`);
    await page.goto(oferta.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2500);

    // 2. Selectores en cascada resilientes (FIX-011)
    const applySelectors = [
      'button:has-text("Postularme")',
      'a:has-text("Postularme")',
      'button:has-text("Aplicar")',
      'a:has-text("Aplicar")',
      '.apply-button',
      '[class*="btn-apply"]',
      'button[type="button"]:has-text("Postular")',
    ];

    let btn = null;
    for (const sel of applySelectors) {
      btn = page.locator(sel).first();
      if ((await btn.count()) > 0) {
        await btn.click();
        log(`✅ Click en botón de postulación: ${sel}`);
        break;
      }
    }

    if (!btn) {
      throw new Error("Ningún selector de postulación funcionó.");
    }

    await page.waitForTimeout(4000);

    // Modal de confirmación en cascada
    const confirmSelectors = [
      'button:has-text("Enviar mi HdV")',
      'input[value="Enviar mi HdV"]',
      'button:has-text("Confirmar")',
      'button:has-text("Aceptar")',
      'button:has-text("Enviar")'
    ];

    for (const sel of confirmSelectors) {
      try {
        const confirmBtn = page.locator(sel).first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click({ timeout: 3000 });
          log(`✅ Confirmado con selector: ${sel}`);
          break;
        }
      } catch {}
    }

    await page.waitForTimeout(2000);
    return { exito: true, razon: "Postulación completada con éxito" };

  } catch (e) {
    log(`❌ Error durante el proceso de aplicación: ${e.message}`);
    return { exito: false, razon: e.message };
  } finally {
    await browser.close();
  }
}

module.exports = { applyToOfferSafe };
