/**
 * scripts/jobs/ct_login_helper.js
 * Helper de autenticación persistente y evasión para Computrabajo.
 * Implementa almacenamiento de estado (cookies) para evitar logins repetitivos.
 */
const fs = require('node:fs');
const path = require('node:path');
const { PATHS } = require('../../lib/data/paths');

const LOGIN_URL = 'https://candidato.co.computrabajo.com/acceso/';
const STATE_PATH = PATHS.COMPUTRABAJO_STATE;

/**
 * Realiza un login robusto evadiendo detecciones y reutilizando sesión si está activa.
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

    // ── Paso 0: Verificar si ya estamos logueados (Session Reuse) ──
    log('  [ct_login] Verificando sesión existente...');
    await page.goto('https://candidato.co.computrabajo.com/candidate/home', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});

    let isLogged = await checkLoginState(page);
    if (isLogged) {
      log('  [ct_login] ✅ Sesión activa detectada (cookies válidas). Saltando login.');
      return true;
    }

    log('  [ct_login] 🔑 Sesión no válida o expirada. Iniciando login formal...');

    // ── PASO 1: Email ──
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('#Email', { state: 'visible', timeout: 15000 });
    await page.fill('#Email', email);
    await page.waitForTimeout(4000); // Demora para simular comportamiento humano

    await page.click('#continueWithMailButton', { timeout: 8000 });

    // ── PASO 2: Password (Redirección segura) ──
    await page.waitForSelector('#password', { state: 'visible', timeout: 15000 });

    // Limpiar y rellenar email en paso 2 por si el formulario se resetea
    try {
      const emailVal = await page.$eval('#Email', e => e.value);
      if (!emailVal) await page.fill('#Email', email);
    } catch { /* campo puede no estar visible */ }

    await page.fill('#password', pass);
    await page.waitForTimeout(500);

    // Botón submit resiliente
    const submitted = await page.evaluate(() => {
      const btns = [
        document.querySelector('#btnSubmitPass'),
        document.querySelector('button[type="submit"]'),
        document.querySelector('input[type="submit"]'),
        [...document.querySelectorAll('button')].find(b => /iniciar|entrar|acceder|login/i.test(b.textContent)),
      ].filter(Boolean);
      if (btns[0]) { btns[0].click(); return true; }
      return false;
    });

    if (!submitted) {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(6000);

    // ── PASO 3: Guardar cookies de sesión ──
    isLogged = await checkLoginState(page);
    if (isLogged) {
      // Guardar el estado de persistencia (cookies y almacenamiento local)
      const state = await page.context().storageState();
      fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
      log(`  [ct_login] ✅ Sesión persistida correctamente en: ${path.basename(STATE_PATH)}`);
      return true;
    }

    return false;
  } catch (error) {
    log(`  [ct_login] ❌ Error en flujo de autenticación: ${error.message}`);
    return false;
  }
}

/**
 * Comprueba si la página actual corresponde a una sesión iniciada.
 */
async function checkLoginState(page) {
  const currentUrl = page.url();
  if (currentUrl.includes('/acceso') || currentUrl.includes('IniciarSesion')) return false;

  // Buscar elementos visuales exclusivos del perfil del candidato
  const hasProfileElements = await page.evaluate(() => {
    return document.querySelector('[class*="user"], [href*="postulaciones"], [href*="mi-cv"], .avatar, .user-name') !== null;
  });

  return hasProfileElements;
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

module.exports = { robustLogin, checkLoginState, LOGIN_URL };
