// fix_job_hunter.js - Refactorización completa del módulo Job Hunter
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname);
const LOG_FILE = path.join(ROOT, "data/logs/job_hunter_fix.log");

function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  fs.appendFileSync(LOG_FILE, entry + "\n");
}

log("🚀 Iniciando refactorización completa de Job Hunter...");

// Crear directorio utils si no existe
const utilsDir = path.join(ROOT, "lib/utils");
if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });

// ======================
// 1. lib/utils/scraper.js (Stealth + Retry)
const scraperContent = `const { chromium } = require('playwright');
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
`;

fs.writeFileSync(path.join(utilsDir, "scraper.js"), scraperContent);
log("✅ lib/utils/scraper.js creado");

// ======================
// 2. lib/utils/retry.js
const retryContent = `async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, i);
      console.warn(\`[Retry] Intento \${i+1}/\${maxRetries} - esperando \${delay}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
module.exports = { withRetry };
`;
fs.writeFileSync(path.join(utilsDir, "retry.js"), retryContent);
log("✅ lib/utils/retry.js creado");

// ======================
// 3. Actualizar scripts existentes (reemplazos automáticos)
const filesToFix = [
  "scripts/jobs/computrabajo_scraper.js",
  "scripts/jobs/computrabajo_apply.js",
  "scripts/jobs/job_loop.js",
];

filesToFix.forEach((file) => {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    log(`⚠️ Archivo no encontrado: ${file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");

  // Reemplazos clave
  content = content.replace(
    /const \{ chromium \} = require\('playwright'\);/g,
    `const { scrapeWithRetry } = require('../../lib/utils/scraper');`,
  );

  content = content.replace(
    /await chromium\.launch/g,
    `// Usando scrapeWithRetry wrapper`,
  );

  fs.writeFileSync(fullPath, content);
  log(`✅ Actualizado: ${file}`);
});

log("Ejecuta ahora: node scripts/jobs/computrabajo_scraper.js para probar.");
console.log("\nRevisa data/logs/job_hunter_fix.log");
