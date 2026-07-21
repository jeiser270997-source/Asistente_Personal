/**
 * scripts/jobs/ct_login_helper.js — v6 (Jul 2026)
 * Helper de autenticación persistente para Computrabajo.
 * 
 * Flujo OAuth/OpenID Connect confirmado:
 * - secure.computrabajo.com/Account/Login
 * - #Email + #continueWithMailButton + #password + Enter key / #btnSubmitPass
 * - Sesión verificable en https://candidato.co.computrabajo.com/candidate/match
 */
const fs = require('node:fs');
const path = require('node:path');
const { PATHS } = require('../../lib/data/paths');

const LOGIN_URL = 'https://candidato.co.computrabajo.com/acceso/';
const VERIFY_URL = 'https://candidato.co.computrabajo.com/candidate/match';
const STATE_PATH = PATHS.COMPUTRABAJO_STATE;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/**
 * Verifica si la sesión está activa navegando a la página de aplicaciones.
 * @param {import('playwright').Page} page
 * @returns {Promise<boolean>}
 */
async function checkLoginState(page) {
  const currentUrl = page.url().toLowerCase();

  // URLs de login conocidas
  if (currentUrl.includes('/acceso') || 
      currentUrl.includes('account/login') || 
      currentUrl.includes('iniciarsesion') ||
      currentUrl.includes('alta-de-hoja')) {
    return false;
  }

  // Verificar por elementos DOM en la página de match
  const hasSession = await page.evaluate(() => {
    const body = document.body.innerText.toLowerCase();
    
    // Indicadores de NO logueado
    if (body.includes('crear hdv') || 
        body.includes('inicia sesión') || 
        body.includes('alta de hoja de vida') ||
        body.includes('crear tu cuenta')) {
      return false;
    }
    
    // Indicadores de sesión activa (panel de candidato)
    const sessionIndicators = [
      'mis aplicaciones', 'cerrar sesión', 'mi área',
      'hoja de vida', 'notificaciones', 'candidato'
    ];
    // También detectar elementos del menú de candidato
    const hasMenu = document.querySelector(
      '[class*="nav-candidate"], [class*="candidate-menu"], ' +
      '[href*="my-applications"], [href*="postulaciones"], ' +
      '[class*="user-info"], [class*="profile"]'
    ) !== null;
    
    return hasMenu || sessionIndicators.some(ind => body.includes(ind));
  });

  return hasSession;
}

/**
 * Realiza login en Computrabajo.
 * 
 * @param {import('playwright').Page} page
 * @param {string} email
 * @param {string} pass
 * @returns {Promise<boolean>} true si la sesión está activa/login exitoso
 */
async function robustLogin(page, email, pass) {
  try {
    // Evasión básica de huella digital
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    if (!email || !pass) {
      throw new Error('Faltan credenciales COMPUTRABAJO_EMAIL o COMPUTRABAJO_PASS en .env');
    }

    // ── Paso 0: Verificar si ya estamos logueados ──
    log('  [ct_login] Verificando sesión existente...');
    await page.goto(VERIFY_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    if (await checkLoginState(page)) {
      log('  [ct_login] ✅ Sesión activa detectada. Saltando login.');
      return true;
    }

    log('  [ct_login] 🔑 Iniciando login formal...');

    // ── PASO 1: Email ──
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // El login carga en secure.computrabajo.com/Account/Login
    await page.waitForSelector('#Email', { state: 'visible', timeout: 10000 });
    await page.fill('#Email', email);
    await page.waitForTimeout(1000);

    // Click Continue
    await page.click('#continueWithMailButton', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // ── PASO 2: Password ──
    // #password y #btnSubmitPass ya están en la página desde el inicio
    await page.waitForSelector('#password', { state: 'visible', timeout: 8000 });
    await page.fill('#password', pass);
    await page.waitForTimeout(500);

    // Submit: USAR ENTER (funciona confirmado) o #btnSubmitPass
    log('  [ct_login] Enviando password (Enter key)...');
    await page.keyboard.press('Enter');

    // Esperar redirección post-login
    await page.waitForTimeout(3000);
    try {
      await page.waitForURL('**/candidate/**', { timeout: 10000 });
    } catch {
      log('  [ct_login] ⚠ Esperando redirección manualmente...');
      await page.waitForTimeout(3000);
    }

    // ── PASO 3: Verificar y guardar sesión ──
    await page.goto(VERIFY_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const loggedIn = await checkLoginState(page);
    if (loggedIn) {
      const state = await page.context().storageState();
      fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
      log(`  [ct_login] ✅ Sesión guardada en: ${path.basename(STATE_PATH)}`);
      return true;
    }

    // Reintento con #btnSubmitPass
    log('  [ct_login] ⚠ Enter no funcionó, intentando con #btnSubmitPass...');
    // Volver a login
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.waitForSelector('#Email', { state: 'visible', timeout: 5000 });
    await page.fill('#Email', email);
    await page.click('#continueWithMailButton', { timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.waitForSelector('#password', { state: 'visible', timeout: 5000 });
    await page.fill('#password', pass);
    await page.waitForTimeout(500);

    // Click en #btnSubmitPass directamente
    try {
      await page.click('#btnSubmitPass', { timeout: 5000 });
      log('  [ct_login] Click en #btnSubmitPass');
      await page.waitForTimeout(5000);
    } catch {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    }

    await page.goto(VERIFY_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const retryLoggedIn = await checkLoginState(page);
    if (retryLoggedIn) {
      const state = await page.context().storageState();
      fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
      log('  [ct_login] ✅ Login exitoso en reintento');
      return true;
    }

    log('  [ct_login] ❌ No se pudo iniciar sesión');
    return false;

  } catch (error) {
    log(`  [ct_login] ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Crea un contexto de browser con la sesión guardada si existe.
 * @param {import('playwright').Browser} browser
 * @returns {Promise<import('playwright').BrowserContext>}
 */
async function createLoggedInContext(browser) {
  const opts = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  };
  if (fs.existsSync(STATE_PATH)) {
    try {
      opts.storageState = STATE_PATH;
      log('  [ct_login] 📂 Contexto con sesión guardada');
    } catch {}
  }
  return browser.newContext(opts);
}

module.exports = { robustLogin, checkLoginState, LOGIN_URL, VERIFY_URL, createLoggedInContext };
