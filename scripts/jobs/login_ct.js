/**
 * scripts/jobs/login_ct.js
 *
 * Login a Computrabajo y guarda el storage state (cookies + localStorage)
 * para reutilizar sesión en scraper y apply sin tener que loguear cada vez.
 *
 * Uso: node scripts/jobs/login_ct.js
 * Genera: data/state/computrabajo_state.json
 *
 * El estado se renueva solo cuando expira (detecta 401/redirect a login).
 */

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');

const STATE_PATH = path.resolve(__dirname, '..', '..', 'data', 'state', 'computrabajo_state.json');
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL;
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

async function login() {
  if (!CT_EMAIL || !CT_PASS) {
    throw new Error('Faltan COMPUTRABAJO_EMAIL o COMPUTRABAJO_PASS en .env');
  }

  console.log('[login_ct] Iniciando sesión en Computrabajo...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await context.newPage();

  try {
    // Ir a login
    await page.goto('https://co.computrabajo.com/Login/IniciarSesion.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Esperar a que cargue la página inicial
    await page.waitForTimeout(2000);

    // Ejecutar login centralizado
    await robustLogin(page, CT_EMAIL, CT_PASS);

    // Verificar si el login fue exitoso
    const currentUrl = page.url();
    if (currentUrl.includes('Login') || currentUrl.includes('IniciarSesion')) {
      console.log('[login_ct] ⚠️ Parece que el login falló. URL actual:', currentUrl);
      // Tomar screenshot para debug
      await page.screenshot({ path: path.join(__dirname, '..', '..', 'data', 'cache', 'login_failed.png') });
      console.log('[login_ct] Screenshot guardado en data/cache/login_failed.png');
      throw new Error('Login failed');
    }

    // Guardar storage state
    const state = await context.storageState();
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log(`[login_ct] ✅ Sesión guardada en ${STATE_PATH}`);

    // Verificar que funciona
    await page.goto('https://co.computrabajo.com/mis-postulaciones', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('[login_ct] ✅ Postulaciones accesibles, sesión activa');

  } catch (e) {
    console.error('[login_ct] ❌ Error:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

login();
