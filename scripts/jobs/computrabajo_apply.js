// scripts/jobs/computrabajo_apply.js - v3 bulletproof (FIX-011)
// Política: SEMI-AUTO por defecto. LIVE solo con --auto y cola no vacía.
require("dotenv").config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require("playwright");
const fs = require('node:fs');
const path = require('node:path');
const { PATHS } = require('../../lib/data/paths');
const { robustLogin } = require('./ct_login_helper');

const STATE_PATH = PATHS.COMPUTRABAJO_STATE;
const QUEUE_PATH = PATHS.APPLY_QUEUE;

function log(msg) {
  console.log(`[APPLY ${new Date().toISOString()}] ${msg}`);
}

/**
 * Política de postulación: default dry-run; LIVE solo con --auto.
 * @param {string[]} argv
 */
function resolveApplyPolicy(argv = process.argv) {
  const auto = argv.includes('--auto');
  const forcedDry = argv.includes('--dry-run');
  const dryRun = !auto || forcedDry;
  return {
    auto: auto && !forcedDry,
    dryRun,
    mode: dryRun ? 'SEMI-AUTO' : 'LIVE',
  };
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
    return Array.isArray(raw) ? raw : (raw.ofertas || raw.queue || []);
  } catch {
    return [];
  }
}

async function applyToOfferSafe(oferta) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  // Intentar cargar sesión guardada antes de crear contexto (FIX-011)
  const hasSavedState = fs.existsSync(STATE_PATH);
  const contextOpts = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    locale: "es-CO",
  };
  if (hasSavedState) {
    contextOpts.storageState = STATE_PATH;
    log('📂 Cargando cookies de sesión persistida...');
  }

  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  try {
    // 1. Ejecutar autenticación (saltará si la sesión es válida)
    const loginOk = await robustLogin(page, process.env.COMPUTRABAJO_EMAIL, process.env.COMPUTRABAJO_PASS);
    if (!loginOk) throw new Error('No se pudo validar sesión en Computrabajo');

    log(`Navegando a la oferta: ${oferta.titulo}`);
    await page.goto(oferta.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2500);

    // 2. Selectores en cascada resilientes (FIX-011)
    const applySelectors = [
      'button:has-text("Postularme")',
      'a:has-text("Postularme")',
      'button:has-text("Aplicar")',
      'a:has-text("Aplicar")',
      '.apply-button',
      '[class*="btn-apply"]',
      'button[type="button"]:has-text("Postular")',
    ];

    let btn = null;
    let clicked = false;
    for (const sel of applySelectors) {
      btn = page.locator(sel).first();
      if ((await btn.count()) > 0) {
        await btn.click();
        log(`✅ Click en botón de postulación: ${sel}`);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      throw new Error("Ningún selector de postulación funcionó.");
    }

    await page.waitForTimeout(4000);

    // Modal de confirmación en cascada
    const confirmSelectors = [
      'button:has-text("Enviar mi HdV")',
      'input[value="Enviar mi HdV"]',
      'button:has-text("Confirmar")',
      'button:has-text("Aceptar")',
      'button:has-text("Enviar")'
    ];

    for (const sel of confirmSelectors) {
      try {
        const confirmBtn = page.locator(sel).first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click({ timeout: 3000 });
          log(`✅ Confirmado con selector: ${sel}`);
          break;
        }
      } catch { /* siguiente selector */ }
    }

    await page.waitForTimeout(2000);
    return { exito: true, razon: "Postulación completada con éxito" };

  } catch (e) {
    log(`❌ Error durante el proceso de aplicación: ${e.message}`);
    return { exito: false, razon: e.message };
  } finally {
    await browser.close();
  }
}

/**
 * Entry point CLI/PM2. Sin --auto: solo reporta cola y sale (semi-auto).
 */
async function main(argv = process.argv) {
  const policy = resolveApplyPolicy(argv);
  const queue = loadQueue();

  log(`Modo: ${policy.mode} | Cola: ${queue.length} oferta(s)`);

  if (policy.dryRun) {
    if (queue.length === 0) {
      log('SEMI-AUTO: sin cola y sin --auto. Nada que hacer. (OK)');
    } else {
      log(`SEMI-AUTO: ${queue.length} pendiente(s). NO se postula sin --auto.`);
      queue.slice(0, 5).forEach((o, i) => {
        log(`  ${i + 1}. ${o.titulo || o.title || '?'} — ${o.url || ''}`);
      });
      log('Para LIVE: node scripts/jobs/computrabajo_apply.js --auto');
    }
    return { mode: policy.mode, applied: 0, skipped: queue.length };
  }

  // LIVE: requiere credenciales y al menos un item
  if (!process.env.COMPUTRABAJO_EMAIL || !process.env.COMPUTRABAJO_PASS) {
    log('❌ LIVE abortado: faltan COMPUTRABAJO_EMAIL / COMPUTRABAJO_PASS en .env');
    process.exitCode = 1;
    return { mode: policy.mode, applied: 0, error: 'missing_credentials' };
  }

  if (queue.length === 0) {
    log('LIVE: cola vacía. Nada que aplicar.');
    return { mode: policy.mode, applied: 0, skipped: 0 };
  }

  let applied = 0;
  const remaining = [];
  for (const oferta of queue) {
    if (!oferta.url) {
      log(`⏭ Sin URL, se omite: ${oferta.titulo || '?'}`);
      continue;
    }
    const result = await applyToOfferSafe(oferta);
    if (result.exito) {
      applied += 1;
      log(`✅ Aplicado: ${oferta.titulo}`);
    } else {
      remaining.push(oferta);
      log(`⚠ Falló, se retiene en cola: ${oferta.titulo} — ${result.razon}`);
    }
  }

  // Persistir cola residual
  try {
    fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(remaining, null, 2), 'utf8');
  } catch (e) {
    log(`⚠ No se pudo actualizar cola: ${e.message}`);
  }

  log(`LIVE terminado. Aplicadas: ${applied} | Quedan: ${remaining.length}`);
  return { mode: policy.mode, applied, skipped: remaining.length };
}

module.exports = { applyToOfferSafe, resolveApplyPolicy, loadQueue, main };

if (require.main === module) {
  main().catch((e) => {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  });
}
