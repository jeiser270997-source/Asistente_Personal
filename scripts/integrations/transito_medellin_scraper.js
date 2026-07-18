require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const RE = require('../../lib/runtime/resume_engine');

const USER = process.env.MEDELLIN_USER || process.env.USER_CC;
const PASS = process.env.MEDELLIN_PASS;
const SPA_URL = 'https://www.medellin.gov.co/portal-movilidad/index.html#/inicio-sesion';
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'cache', 'medellin');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

async function pageText(page) {
  // intenta multiple estrategias
  return page.evaluate(() => {
    // estrategia 1: body directo
    const body = document.body?.innerText;
    if (body && body.trim().length > 200) return body;

    // estrategia 2: contenedor principal comun en SPAs
    for (const sel of ['main', '[role=main]', '.container', '.content', '#content', '.dashboard', '.app-content', 'app-root', 'app-dashboard']) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 50) return el.innerText;
    }

    // estrategia 3: todos los divs con texto significativo
    const divs = Array.from(document.querySelectorAll('div'));
    for (const d of divs) {
      if (d.innerText && d.innerText.trim().length > 300) return d.innerText;
    }

    return body || '';
  });
}

async function scrapeMultas() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    log('Navegando al portal SPA de Medellin...');
    await page.goto(SPA_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);

    log('Buscando campos de login en el SPA...');
    const userField = await page.$('input[type="text"]') || await page.$('input[placeholder*="suario"]') || await page.$('input[placeholder*="ocumento"]') || await page.$('input[formcontrolname="username"]');
    const passField = await page.$('input[type="password"]') || await page.$('input[formcontrolname="password"]');

    if (!userField || !passField) {
      log('No se encontraron campos de login. Capturando debug...');
      await page.screenshot({ path: path.join(DATA_DIR, 'debug_spa.png') });
      const html = await page.content();
      fs.writeFileSync(path.join(DATA_DIR, 'debug_spa.html'), html);
      return null;
    }

    log('Llenando credenciales...');
    await userField.fill(USER);
    await passField.fill(PASS);
    await page.waitForTimeout(300);

    const loginBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Ingresar"), button:has-text("Entrar")');
    if (loginBtn) {
      await loginBtn.click();
      log('Click en boton Ingresar');
    } else {
      await passField.press('Enter');
      log('Enter en password');
    }

    // ESPERA REAL: network idle + que haya contenido en la pagina
    log('Esperando carga del dashboard post-login...');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => log('networkidle timeout, continuando...'));
    await page.waitForTimeout(3000);

    // Esperar a que aparezca contenido real (no la pagina de login)
    try {
      await page.waitForFunction(() => {
        const t = document.body?.innerText || '';
        // si ya no estamos en login y hay minimo contenido
        return t.length > 100 && !t.includes('Iniciar sesi');
      }, { timeout: 45000, polling: 1000 });
      log('Contenido del dashboard detectado');
    } catch {
      log('Timeout esperando contenido, capturando lo que haya...');
      await page.screenshot({ path: path.join(DATA_DIR, 'timeout_dashboard.png') });
    }

    log(`URL post-login: ${page.url()}`);

    // Cerrar modales que aparezcan
    for (const text of ['Aceptar', 'Cerrar', 'OK', 'Entendido', 'Continuar', 'Cerrar sesión']) {
      try {
        const b = await page.$(`button:has-text("${text}")`);
        if (b && await b.isVisible()) {
          await b.click();
          log(`Modal/notificacion cerrado: ${text}`);
          await page.waitForTimeout(500);
        }
      } catch (e) {}
    }
    await page.waitForTimeout(2000);

    log('Extrayendo datos del dashboard...');
    const extractedText = await pageText(page);
    fs.writeFileSync(path.join(DATA_DIR, 'dashboard.txt'), extractedText);
    await page.screenshot({ path: path.join(DATA_DIR, 'dashboard.png'), fullPage: true });

    // Tomar HTML completo como respaldo
    const html = await page.content();
    fs.writeFileSync(path.join(DATA_DIR, 'dashboard.html'), html);

    log(`Texto extraido: ${extractedText.length} caracteres`);

    return { text: extractedText, html };
  } finally {
    await browser.close();
  }
}

async function main() {
  ensureDir();
  RE.start('transito_medellin_scraper');
  log('═══════════════════════════════════════');
  log('TRANSITO MEDELLIN SCRAPER v2 (SPA)');
  log('═══════════════════════════════════════');

  if (!PASS) {
    log('Falta MEDELLIN_PASS en .env');
    process.exit(1);
  }

  try {
    const data = await scrapeMultas();
    if (!data) throw new Error('No se pudo extraer la info');
    RE.finish('transito_medellin_scraper', 'success', { run: true });
    log('Consulta completada');
    log(JSON.stringify(parseMultas(data.text), null, 2));
  } catch (err) {
    RE.finish('transito_medellin_scraper', 'error', { reason: err.message });
    log(`Error: ${err.message}`);
  }
}

function parseMultas(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const multas = [];
  let current = {};
  for (const line of lines) {
    if (/^[A-Z]{3}\d{3}$/.test(line)) {
      if (current.placa) multas.push(current);
      current = { placa: line };
    } else if (line.startsWith('C') && line.includes('Conducir')) {
      current.infraccion = line;
    } else if (line.includes('COP') && line.includes('.')) {
      if (!current.valor) current.valor = line;
      else if (!current.intereses) current.intereses = line;
      else current.total = line;
    } else if (line.includes('Pendiente')) {
      current.estado = 'Pendiente de pago';
    } else if (line.includes('septiembre') || line.includes('2024') || line.includes('2025') || line.includes('2026')) {
      if (line.match(/\d{2}\s+\w+/)) current.fecha = line;
    }
  }
  if (current.placa) multas.push(current);
  return multas;
}

main().catch(err => { log(`Fatal: ${err.message}`); process.exit(1); });
