/**
 * scripts/jobs/build_cv.js
 *
 * Generador de PDF de Hoja de Vida en formato Harvard.
 * Usa Playwright para renderizar el template HTML y exportarlo como PDF.
 *
 * Uso: node scripts/jobs/build_cv.js
 */

const path = require('path');
const { chromium } = require('playwright');

const TEMPLATE_PATH = path.resolve(__dirname, '../../data/jobs/cv_harvard_template.html');
const OUTPUT_PATH   = path.resolve(__dirname, '../../data/jobs/CV_Jeiser_Gutierrez_QA_Automation.pdf');

async function buildCV() {
  console.log('[CV Builder] Iniciando generación de PDF...');
  
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  // Cargar el template HTML local
  await page.goto(`file://${TEMPLATE_PATH}`, { waitUntil: 'load' });

  // Dar tiempo al CSS para renderizar
  await page.waitForTimeout(500);

  // Exportar como PDF con márgenes 0 (el HTML ya maneja el padding)
  await page.pdf({
    path:              OUTPUT_PATH,
    format:            'Letter',
    printBackground:   true,
    margin:            { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
  });

  await browser.close();

  console.log(`[CV Builder] ✅ PDF generado exitosamente:`);
  console.log(`   → ${OUTPUT_PATH}`);
  console.log(`[CV Builder] Súbelo a Computrabajo como tu CV predeterminado.`);
}

buildCV().catch(err => {
  console.error('[CV Builder] ❌ Error:', err.message);
  process.exit(1);
});
