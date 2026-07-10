const { chromium } = require('playwright');

(async () => {
  console.log('Iniciando Playwright para verificar Dashboard...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log(`Status code: ${response.status()}`);
    
    // Esperar a que pase el skeleton de carga
    await page.waitForSelector('text=LifeOS Dashboard', { timeout: 10000 });
    
    // Verificar que no haya error
    const legalText = await page.locator('text=Legal & Tránsito').isVisible();
    const memoText = await page.locator('text=Memoria Reciente').isVisible();
    
    if (legalText && memoText) {
      console.log('✅ UI renders successfully!');
    } else {
      console.error('❌ UI failed to render completely.');
    }
    
    await page.screenshot({ path: 'C:/Users/dev/.gemini/antigravity/brain/5e43676e-16e4-4b25-a000-f2cc5aa9bb2b/playwright_screenshot.png' });
    console.log('Screenshot guardado.');
  } catch (err) {
    console.error('Error durante la verificación:', err);
    await page.screenshot({ path: 'C:/Users/dev/.gemini/antigravity/brain/5e43676e-16e4-4b25-a000-f2cc5aa9bb2b/playwright_error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
