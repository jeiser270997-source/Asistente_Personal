const { chromium } = require('playwright');
const { withRetry } = require('./retry');

async function createStealthContext() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'es-CO',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
  });
  return { browser, context };
}

async function scrapeWithRetry(url, callback, maxRetries = 3) {
  return withRetry(async () => {
    const { browser, context } = await createStealthContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      return await callback(page);
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  }, maxRetries);
}

module.exports = { createStealthContext, scrapeWithRetry };
