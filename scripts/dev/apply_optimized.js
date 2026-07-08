/**
 * generate_cv_pdf.js
 * Genera PDF desde el CV HTML optimizado y sube a perfil CT
 * Luego aplica a las ofertas indicadas
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('node:path');
const fs   = require('node:fs');

const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS;

const CV_HTML = path.join(__dirname, '..', 'data', 'jobs', 'cv_jeiser_soporte_ti.html');
const CV_PDF  = path.join(__dirname, '..', 'data', 'jobs', 'cv_jeiser_soporte_ti.pdf');

const OFERTAS = [
  {
    titulo: 'Auxiliar de Soporte Técnico — Comfenalco Antioquia',
    url: 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-soporte-tecnico-en-medellin-8499E6F0A657F98161373E686DCF3405',
  },
  {
    titulo: 'Auxiliar de sistemas — C.I ESLOP SAS',
    url: 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405',
  },
];

// ── 1. Generar PDF ────────────────────────────────────────────────
async function generatePDF() {
  console.log('📄 Generando PDF desde CV HTML...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///${CV_HTML.replace(/\\/g, '/')}`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.pdf({
    path: CV_PDF,
    format: 'Letter',
    printBackground: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  const sizeMB = (fs.statSync(CV_PDF).size / 1024).toFixed(0);
  console.log(`  ✅ PDF generado: ${CV_PDF} (${sizeMB} KB)`);
}

// ── 2. Login CT ────────────────────────────────────────────────────
async function loginCT(page) {
  await page.goto('https://candidato.co.computrabajo.com/acceso/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.locator('#Email, input[name="Email"]').first().fill(CT_EMAIL, { timeout: 10000 });
  await page.locator('#password, input[name="Password"]').first().fill(CT_PASS, { timeout: 5000 });
  await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  const ok = page.url().includes('candidate/home');
  console.log(`  🔑 Login: ${ok ? '✅ OK' : '⚠️  ' + page.url().substring(0, 60)}`);
  return ok;
}

// ── 3. Subir CV al perfil CT ───────────────────────────────────────
async function uploadCV(page) {
  console.log('\n📤 Subiendo CV optimizado al perfil CT...');
  await page.goto('https://candidato.co.computrabajo.com/candidate/cv', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);

  // Buscar input file para el CV
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    // Intentar buscar botón de "subir CV" o "adjuntar"
    const uploadBtn = page.locator('a:has-text("Adjuntar"), button:has-text("Subir"), a:has-text("Subir"), a:has-text("CV"), [class*="upload"]').first();
    if (await uploadBtn.count() > 0) {
      await uploadBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1500);
    }
  }

  // Buscar input file de nuevo
  const input = page.locator('input[type="file"]').first();
  if (await input.count() > 0) {
    await input.setInputFiles(CV_PDF);
    await page.waitForTimeout(2000);
    // Confirmar subida
    const confirmBtn = page.locator('button:has-text("Guardar"), button:has-text("Aceptar"), button[type="submit"]').first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
    }
    console.log('  ✅ CV subido al perfil CT');
    return true;
  } else {
    // Tomar screenshot para debug
    await page.screenshot({ path: path.join(__dirname, '..', 'diag_cv_upload.png') });
    console.log('  ⚠️  No se encontró input de archivo. Screenshot: diag_cv_upload.png');
    console.log('  URL actual:', page.url());
    return false;
  }
}

// ── 4. Aplicar a oferta (flujo completo con modal de confirmación) ─
async function aplicar(page, oferta) {
  console.log(`\n📨 Aplicando: ${oferta.titulo}`);
  await page.goto(oferta.url.split('#')[0], { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2500);

  // CT usa "Postularme" como texto principal del botón
  const btnTextos = ['Postularme', 'Postular', 'Aplicar', 'Apply'];
  let clicked = false;

  for (const txt of btnTextos) {
    try {
      await page.click(`button:has-text("${txt}"), a:has-text("${txt}")`, { timeout: 4000 });
      clicked = true;
      console.log(`  ✅ Click en "${txt}"`);
      break;
    } catch {}
  }

  if (!clicked) {
    console.log('  ❌ No se encontró botón de postulación');
    await page.screenshot({ path: `diag_apply_${Date.now()}.png` });
    return false;
  }

  // Esperar modal de confirmación
  await page.waitForTimeout(2500);

  // CT muestra modal con "Enviar mi HdV" o similar
  const confirmTextos = ['Enviar mi HdV', 'Enviar', 'Confirmar', 'Aceptar', 'Postularme'];
  for (const txt of confirmTextos) {
    try {
      const btn = page.locator(`button:has-text("${txt}"), input[value="${txt}"]`).first();
      if (await btn.count() > 0) {
        await btn.click({ timeout: 4000 });
        await page.waitForTimeout(2000);
        console.log(`  ✅ Confirmado con "${txt}"`);
        return true;
      }
    } catch {}
  }

  // Si no hubo modal de confirmación, puede que la postulación ya se haya enviado directamente
  const pageText = await page.evaluate(() => document.body.innerText);
  if (/postulado|aplicado|enviado|gracias/i.test(pageText)) {
    console.log('  ✅ Aplicación enviada (sin modal adicional)');
    return true;
  }

  console.log('  ⚠️  No se encontró confirmación. URL:', page.url().substring(0, 80));
  await page.screenshot({ path: `diag_apply_confirm_${Date.now()}.png` });
  return false;
}

// ── MAIN ─────────────────────────────────────────────────────────
(async () => {
  // 1. Generar PDF
  await generatePDF();

  // 2. Login
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
    permissions: ['geolocation'],
    geolocation: { latitude: 6.2442, longitude: -75.5812 },
  });
  const page = await ctx.newPage();

  const loggedIn = await loginCT(page);
  if (!loggedIn) {
    console.log('❌ Login fallido. Abortando.');
    await browser.close();
    return;
  }

  // 3. Subir CV
  const cvUploaded = await uploadCV(page);
  if (!cvUploaded) {
    console.log('\n⚠️  CV no subido automáticamente.');
    console.log('   → Sube manualmente el PDF: data/artifacts/jobs/cv_jeiser_soporte_ti.pdf');
    console.log('   → Aún así, aplicando con CV del perfil actual...\n');
  }

  // 4. Aplicar a cada oferta
  const resultados = [];
  for (const oferta of OFERTAS) {
    const ok = await aplicar(page, oferta);
    resultados.push({ ...oferta, aplicado: ok });
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Resumen
  console.log('\n════════════════════════════════');
  console.log('  RESUMEN DE APLICACIONES');
  console.log('════════════════════════════════');
  resultados.forEach(r => {
    console.log(`${r.aplicado ? '✅' : '❌'} ${r.titulo}`);
  });
})().catch(e => console.error('Fatal:', e.message));
