/**
 * scripts/jobs/ct_login_helper.js
 *
 * Lógica robusta y centralizada para el login en Computrabajo.
 * Supera los A/B testing y cambios de selectores semánticos.
 *
 * Actualizado: Computrabajo ahora usa login de 2 pasos (secure.computrabajo.com)
 *   Paso 1: Email + "Continuar"
 *   Paso 2: Password + "Iniciar sesión"
 */

/**
 * Realiza un login seguro en Computrabajo (login de 2 pasos).
 *
 * @param {import('playwright').Page} page - Instancia de Playwright
 * @param {string} email - Correo del usuario
 * @param {string} pass - Contraseña del usuario
 * @returns {Promise<boolean>} true si el login fue exitoso, false si no se detectó dashboard post-login
 */
async function robustLogin(page, email, pass) {
  try {
    // Anti-detección: ocultar webdriver
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // ── PASO 1: Email ──────────────────────────────────────────
    if (!email || !pass) {
      throw new Error('Faltan credenciales de Computrabajo en el entorno (.env o Secrets)');
    }

    // El login redirige automáticamente de /acceso/ a secure.computrabajo.com
    // Esperar campo email
    const emailInput = page.locator('#Email, .it-email, input[type="email"], input[name="Email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await emailInput.fill(email);

    // Click en botón "Continuar"
    const btnContinuar = page.locator('#continueWithMailButton, button:has-text("Continuar"), .b_primary_inv').first();
    await btnContinuar.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón Continuar no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // ── PASO 2: Password ───────────────────────────────────────
    // Esperar a que aparezca el campo de contraseña (se muestra tras validar email)
    const passInput = page.locator('#password, input[type="password"], .cm-12.rounded').first();
    await passInput.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);
    await passInput.fill(pass);

    // Click en botón "Iniciar sesión"
    const btnEntrar = page.locator('#btnSubmitPass, a:has-text("Iniciar sesión"), button:has-text("Entrar")').first();
    await btnEntrar.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón de inicio de sesión no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // Esperar a que procese el login
    await page.waitForTimeout(5000);

    // ── VERIFICACIÓN ───────────────────────────────────────────
    // Verificar login exitoso: buscar elementos del dashboard post-login
    const loginOk = await page.waitForSelector(
      '.menu_log, .info_user, .ccp_menu, [class*="user-menu"], a[href*="postulaciones"], [href*="/candidate/home"]',
      { timeout: 10000 }
    ).then(() => true).catch(() => false);

    if (!loginOk) {
      console.error('  [ct_login_helper] ⚠️ Login aparentemente fallido — no se detectó dashboard post-login');
      return false;
    }

    return true;
  } catch (error) {
    console.error('  [ct_login_helper] Error crítico durante el login:', error.message.substring(0, 100));
    throw error;
  }
}

module.exports = {
  robustLogin
};
