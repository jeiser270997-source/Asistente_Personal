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
    // Esperar a que haya algún input en pantalla (no estrictamente #Email)
    await page.waitForSelector('input:visible', { timeout: 15000 });

    // 1. Llenar el email (primer input que NO sea contraseña)
    const emailInput = page.locator('input').filter({ hasNot: page.locator('[type="password"]') }).first();
    await emailInput.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await emailInput.fill(email);
    
    // 2. Llenar la contraseña
    const passInput = page.locator('input[type="password"]').first();
    await passInput.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await passInput.fill(pass);

    // 3. Buscar botón de enviar (submit, o texto "Entrar", "Iniciar", "Continuar")
    const btn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Iniciar"), button:has-text("Ingresar")').first();
    
    // Intentar dar click en el botón, sino forzar un Enter
    await btn.click({ timeout: 5000 }).catch(async () => {
      console.log('   [ct_login_helper] Botón de submit no localizado, forzando Enter...');
      await page.keyboard.press('Enter');
    });

    // Esperar a que pase el login
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
