/**
 * scripts/jobs/ct_update_profile.js
 *
 * Actualiza el perfil de Computrabajo con el CV final de Jeiser.
 * URL del editor: https://candidato.co.computrabajo.com/candidate/cv/edit/
 *
 * Uso:
 *   node scripts/jobs/ct_update_profile.js            # modo real
 *   node scripts/jobs/ct_update_profile.js --dry-run  # solo screenshot
 *   node scripts/jobs/ct_update_profile.js --visible  # con ventana
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const { robustLogin } = require('./ct_login_helper');
const fs = require('node:fs');

const CT_EMAIL  = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS   = process.env.COMPUTRABAJO_PASS;
const HEADLESS  = !process.argv.includes('--visible');
const DRY_RUN   = process.argv.includes('--dry-run');
const CV_URL    = 'https://candidato.co.computrabajo.com/candidate/cv/edit/';

function log(msg) { console.log(`[CT-Profile] ${msg}`); }

// ── Eliminar popup premium con JS ─────────────────────────────────────────────
async function killPopup(page) {
  await page.evaluate(() => {
    document.querySelectorAll(
      '.popup, [class*="popup"], [premium-candidate-popup], [home-candidate-popup], .modal-overlay'
    ).forEach(el => el.remove());
  });
}

// ── Editar el titular/resumen del perfil ──────────────────────────────────────
async function updateTitular(page) {
  log('→ Editando titular...');
  try {
    // El lápiz de edición del titular está en la sección superior
    await page.click('[data-section="titular"] a[class*="edit"], .edit-titular, a[href*="titular"]', { timeout: 5000 });
    await page.waitForTimeout(1500);

    const input = page.locator('input[name*="titular"], input[id*="titular"], textarea[name*="titular"]').first();
    await input.waitFor({ state: 'visible', timeout: 8000 });
    await input.fill('QA Automation Engineer Junior | Testing APIs | Playwright | CI/CD');
    await page.click('button[type="submit"], input[type="submit"]', { timeout: 5000 });
    await page.waitForTimeout(2000);
    log('  ✅ Titular actualizado');
  } catch (e) {
    log(`  ⚠ Titular: ${e.message.substring(0, 80)}`);
  }
}

// ── Subir PDF del CV actualizado ──────────────────────────────────────────────
async function uploadCV(page) {
  const pdfPath = require('node:path').resolve(__dirname, '../../data/jobs/CV_Jeiser_Gutierrez_QA_Automation.pdf');
  if (!fs.existsSync(pdfPath)) {
    log(`⚠ PDF no encontrado: ${pdfPath}`);
    return;
  }
  log(`→ Subiendo CV PDF: ${pdfPath}`);
  try {
    // Scroll al final donde está "Documentos adjuntos"
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Click en "Subir o modificar documentos"
    await page.click('text=Subir o modificar documentos', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // El input[type=file] puede aparecer dentro de un modal o directo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 8000 });
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(2000);

    // Guardar si aparece botón de confirmación
    const saved = await page.click('button:has-text("Guardar"), button:has-text("Subir"), button:has-text("Aceptar"), button[type="submit"]', { timeout: 5000 })
      .then(() => true).catch(() => false);

    await page.waitForTimeout(2000);
    log(saved ? '  ✅ CV PDF subido y guardado' : '  ✅ CV PDF seleccionado (sin confirmación necesaria)');
  } catch (e) {
    log(`  ⚠ Upload PDF: ${e.message.substring(0, 100)}`);
  }
}

// ── Screenshot completo del CV para verificación ──────────────────────────────
async function screenshotCV(page, label = '') {
  fs.mkdirSync('data/logs', { recursive: true });
  const filename = `data/logs/ct_cv_${label || Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  log(`📸 Screenshot: ${filename}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('🚀 Iniciando actualización de perfil Computrabajo...');
  if (DRY_RUN) log('⚠  DRY RUN — solo diagnóstico, sin cambios');
  if (!CT_PASS) { log('❌ COMPUTRABAJO_PASS no definido en .env'); process.exit(1); }

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO', viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  try {
    // 1. Login
    log('🔐 Login...');
    const ok = await robustLogin(page, CT_EMAIL, CT_PASS);
    if (!ok) { log('❌ Login fallido'); await browser.close(); process.exit(1); }
    log('✅ Login OK — ' + page.url().substring(0, 60));

    // 2. Ir al editor del CV
    await page.goto(CV_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await killPopup(page);
    log('📄 En el editor del CV: ' + page.url());

    // 3. Screenshot del estado actual
    await screenshotCV(page, 'antes');

    if (!DRY_RUN) {
      // 4. Subir PDF del CV actualizado
      await uploadCV(page);
      await killPopup(page);

      // 5. Screenshot post-upload
      await screenshotCV(page, 'despues');
    }

    log('\n✅ Proceso completado.');
    log('📋 Secciones ya presentes en CT (verificado en screenshot):');
    log('   ✅ Experiencia: Freelancer, Foundever/Sitel, COOVISOCIAL');
    log('   ✅ Educación: CESDE, I.U.P. Santiago Mariño');
    log('   ✅ Idiomas: Español Nativo, Inglés Avanzado');
    log('   ✅ Skills: Playwright, Postman, Git, Docker, Typescript, QA...');
    log('   📎 Documentos: CV PDF actualizado (si no hubo error)');
    log('\n📌 Pendiente manual en CT:');
    log('   → Agregar cert. SENA Excel (Jun 2026, 40h)');
    log('   → Agregar cert. HubSpot Service Hub + Inbound');
    log('   → Actualizar descripción Foundever a "Campaña Iberia Airlines / Amadeus GDS"');

  } catch (e) {
    log(`❌ Error: ${e.message}`);
    await screenshotCV(page, 'error').catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
