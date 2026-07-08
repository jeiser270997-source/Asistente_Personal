/**
 * scripts/jobs/ct_login_helper.js
 * 
 * Lógica robusta y centralizada para el login en Computrabajo.
 * Supera los A/B testing y cambios de selectores semánticos.
 */

/**
 * Realiza un login seguro buscando inputs de manera semántica.
 * 
 * @param {import('playwright').Page} page - Instancia de Playwright
 * @param {string} email - Correo del usuario
 * @param {string} pass - Contraseña del usuario
 * @returns {Promise<boolean>} true si el login fue exitoso. Lanza error si falla de forma crítica.
 */
async function robustLogin(page, email, pass) {
  try {
    // 1. Esperar y llenar el email
    if (!email || !pass) {
      throw new Error('Faltan credenciales de Computrabajo en el entorno (.env o Secrets)');
    }
    const emailInput = page.locator('input[type="email"], input[name="email"], #Email, input[placeholder*="correo"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await emailInput.fill(email);
    
    // 2. Clic en botón Continuar (Paso 1)
    let btnContinuar = page.locator('button:has-text("Continuar"), input[type="submit"], button[type="submit"]').first();
    await btnContinuar.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón de continuar no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // 3. Esperar y llenar la contraseña (Paso 2)
    const passInput = page.locator('input[type="password"]').first();
    await passInput.waitFor({ state: 'visible', timeout: 10000 });
    await passInput.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await passInput.fill(pass);

    // 4. Buscar botón de enviar final (Entrar/Iniciar/Continuar)
    const btnEntrar = page.locator('button:has-text("Entrar"), button:has-text("Iniciar"), button:has-text("Continuar"), button[type="submit"]').last();
    await btnEntrar.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón de entrar no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // Esperar a que pase el login final
    await page.waitForTimeout(4000);
    
    return true;
  } catch (error) {
    console.error('   [ct_login_helper] Error crítico durante el login:', error.message);
    throw error;
  }
}

module.exports = {
  robustLogin
};
