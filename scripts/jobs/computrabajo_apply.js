// scripts/jobs/computrabajo_apply.js - v2 robusta (anti-timeout)
require("dotenv").config();
const { chromium } = require("playwright");

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[APPLY ${ts}] ${msg}`);
}

async function login(page) {
  log("🔑 Iniciando login en Computrabajo...");

  await page.goto("https://co.computrabajo.com/login", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  // Espera activa al campo de email en lugar de timeout ciego
  await page.waitForSelector('input[name="email"], #email, input[type="email"]', { state: 'visible', timeout: 15000 }).catch(() => null);

  // Múltiples selectores posibles
  const emailSelectors = [
    'input[name="email"]',
    "#email",
    'input[placeholder*="email" i]',
    'input[type="email"]',
  ];

  let emailField = null;
  for (const sel of emailSelectors) {
    emailField = page.locator(sel).first();
    if ((await emailField.count()) > 0) {
      await emailField.fill(process.env.COMPUTRABAJO_EMAIL || "");
      log(`✅ Campo email encontrado con: ${sel}`);
      break;
    }
  }

  if (!emailField) {
    throw new Error("No se encontró campo de email");
  }

  await page.keyboard.press("Enter");
  await page.waitForTimeout(4000);

  // Password
  const passSelectors = [
    'input[name="password"]',
    "#password",
    'input[type="password"]',
  ];
  let passField = null;
  for (const sel of passSelectors) {
    passField = page.locator(sel).first();
    if ((await passField.count()) > 0) {
      await passField.fill(process.env.COMPUTRABAJO_PASS || "");
      log("✅ Campo password llenado");
      break;
    }
  }

  if (passField) {
    await page.keyboard.press("Enter");
  }

  await page.waitForURL(/computrabajo.com/, { timeout: 30000 });
  log("✅ Login exitoso");
}

async function applyToOffer(page, oferta) {
  log(`Postulando a: ${oferta.titulo}`);
  await page.goto(oferta.url, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForTimeout(2500);

  const applySelectors = [
    'button:has-text("Postularme")',
    'a:has-text("Postularme")',
    ".apply-button",
    'button[type="button"]:has-text("Postular")',
  ];

  let btn = null;
  for (const sel of applySelectors) {
    btn = page.locator(sel).first();
    if ((await btn.count()) > 0) {
      await btn.click();
      log(`✅ Botón encontrado con: ${sel}`);
      break;
    }
  }

  if (!btn) {
    return { exito: false, razon: "Botón de postulación no encontrado" };
  }

  await page.waitForTimeout(5000);
  return { exito: true, razon: "Postulación iniciada" };
}

async function applyToOfferSafe(oferta) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  try {
    await login(page);
    const result = await applyToOffer(page, oferta);
    return result;
  } catch (e) {
    log(`❌ Error durante apply: ${e.message}`);
    return { exito: false, razon: e.message };
  } finally {
    await browser.close();
  }
}

module.exports = { applyToOffer, applyToOfferSafe, login };
