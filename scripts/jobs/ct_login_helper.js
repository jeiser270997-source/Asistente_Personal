/**
 * scripts/jobs/ct_login_helper.js
 *
 * Login robusto Computrabajo — flujo actualizado Jul 2026
 * URL: https://candidato.co.computrabajo.com/acceso/
 * Paso 1: Email → Continuar (redirige a secure.computrabajo.com)
 * Paso 2: Password → Submit
 */

const LOGIN_URL = 'https://candidato.co.computrabajo.com/acceso/';

async function robustLogin(page, email, pass) {
  try {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    if (!email || !pass) {
      throw new Error('Faltan credenciales COMPUTRABAJO_EMAIL / COMPUTRABAJO_PASS en .env');
    }

    // ── PASO 1: Email ─────────────────────────────────────────────
    console.log('  [ct_login] Paso 1: ingresando email...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('#Email', { state: 'visible', timeout: 15000 });
    await page.fill('#Email', email);
    await page.waitForTimeout(500);

    await page.click('#continueWithMailButton', { timeout: 8000 });
    console.log('  [ct_login] Click Continuar OK');

    // ── PASO 2: Password (en secure.computrabajo.com) ─────────────
    await page.waitForSelector('#password', { state: 'visible', timeout: 15000 });
    console.log('  [ct_login] Paso 2: ingresando password...');

    // Limpiar y rellenar email en paso 2 por si se resetea
    try {
      const emailVal = await page.$eval('#Email', e => e.value);
      if (!emailVal) await page.fill('#Email', email);
    } catch { /* campo puede no estar visible */ }

    await page.fill('#password', pass);
    await page.waitForTimeout(500);

    // Botón submit — buscar por orden de preferencia
    const submitted = await page.evaluate(() => {
      const btns = [
        document.querySelector('#btnSubmitPass'),
        document.querySelector('button[type="submit"]'),
        document.querySelector('input[type="submit"]'),
        [...document.querySelectorAll('button')].find(b =>
          /iniciar|entrar|acceder|login/i.test(b.textContent)
        ),
      ].filter(Boolean);
      if (btns[0]) { btns[0].click(); return true; }
      return false;
    });

    if (!submitted) {
      console.log('  [ct_login] Submit button no encontrado, usando Enter');
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(5000);

    // ── VERIFICACIÓN ──────────────────────────────────────────────
    const currentUrl = page.url();
    const loginOk = currentUrl.includes('candidato.co.computrabajo.com') &&
                    !currentUrl.includes('/acceso') &&
                    !currentUrl.includes('Account/Login');

    if (!loginOk) {
      // Fallback: buscar elementos de dashboard
      const dashOk = await page.waitForSelector(
        '[class*="user"], [href*="postulaciones"], [href*="mi-cv"], .avatar, .user-name',
        { timeout: 8000 }
      ).then(() => true).catch(() => false);

      if (!dashOk) {
        console.error('  [ct_login] ⚠️ Login fallido. URL:', currentUrl.substring(0, 80));
        return false;
      }
    }

    console.log('  [ct_login] ✅ Login exitoso. URL:', page.url().substring(0, 60));
    return true;
  } catch (error) {
    console.error('  [ct_login] Error crítico:', error.message.substring(0, 120));
    throw error;
  }
}

module.exports = { robustLogin, LOGIN_URL };
