require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;

const OUT_DIR = path.join(__dirname, '..', '..', 'data', 'sena', 'scrum', 'materiales');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function downloadFile(page, fileUrl, destPath) {
  try {
    const result = await page.evaluate(async (url) => {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (blob.size < 300) return null;
      const arrayBuf = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuf));
      return { bytes, size: blob.size };
    }, fileUrl);

    if (!result) return false;
    fs.writeFileSync(destPath, Buffer.from(result.bytes));
    return result.size;
  } catch (err) {
    return false;
  }
}

async function main() {
  log('🚀 Iniciando Descargador de Materiales de Scrum (Ficha 3565476)...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    acceptDownloads: true
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  log('🔑 Autenticando en SENA Zajuna...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const select = page.locator('select[name="typeDocument"]').first();
  if (await select.isVisible()) await select.selectOption('CC');

  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);

  await page.evaluate(() => {
    const form = document.querySelector('form[action*="singIn"], form[action*="login"], form');
    if (form) form.submit();
  });

  await page.waitForTimeout(5000);
  log('📌 Autenticación lista. Buscando curso de Scrum...');

  // Navegar a mis cursos
  await page.goto(`${BASE_URL}/zajuna/my/courses.php`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Localizar enlace del curso de Scrum
  const courseLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="course/view.php"]'));
    return anchors.map(a => ({ text: a.innerText.replace(/\s+/g, ' ').trim(), href: a.href }));
  });

  const scrumCourse = courseLinks.find(c => c.text.toLowerCase().includes('scrum') || c.text.includes('3565476'));
  const targetUrl = scrumCourse ? scrumCourse.href : `${BASE_URL}/zajuna/course/view.php?id=121953`;

  log(`📚 Navegando al curso Scrum: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Extraer todos los recursos descargables
  const resources = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="resource"], a[href*="folder"], a[href*="file.php"], a[href*="pluginfile.php"], a[href*=".pdf"], a[href*="mod/page"]'));
    return links.map(l => ({ text: l.innerText.replace(/\s+/g, ' ').trim(), href: l.href }));
  });

  log(`🔎 Se encontraron ${resources.length} enlace(s) a recursos en la página principal del curso.`);

  const downloadedFiles = [];

  for (let i = 0; i < resources.length; i++) {
    const r = resources[i];
    if (!r.href || r.href.includes('#')) continue;

    let filename = path.basename(new URL(r.href).pathname).split('?')[0];
    if (!filename || filename.length < 3) {
      const cleanName = (r.text || `material_${i+1}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      filename = `${cleanName}.pdf`;
    }
    if (!filename.includes('.')) filename += '.pdf';

    const destPath = path.join(OUT_DIR, filename);
    log(`[${i+1}/${resources.length}] Descargando: "${filename}"...`);

    const bytes = await downloadFile(page, r.href, destPath);
    if (bytes) {
      const kb = Math.round(bytes / 1024);
      log(`   ✓ Guardado (${kb} KB): ${filename}`);
      downloadedFiles.push({ name: filename, size_kb: kb, url: r.href });
    } else {
      log(`   ℹ️ El enlace es página o recurso dinámico, extrayendo contenido de vista...`);
      // Si es una subpágina, visitarla para buscar archivos embebidos
      try {
        await page.goto(r.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);
        const subLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href*="file.php"], a[href*="pluginfile.php"], a[href*=".pdf"]')).map(a => a.href);
        });
        for (const sl of subLinks) {
          const subName = path.basename(new URL(sl).pathname).split('?')[0] || `sub_resource_${Date.now()}.pdf`;
          const subDest = path.join(OUT_DIR, subName);
          const subBytes = await downloadFile(page, sl, subDest);
          if (subBytes) {
            const kb = Math.round(subBytes / 1024);
            log(`   ✓ Embebido Guardado (${kb} KB): ${subName}`);
            downloadedFiles.push({ name: subName, size_kb: kb, url: sl });
          }
        }
      } catch (e) {}
    }
  }

  // Guardar índice final
  const summary = {
    curso: 'Formación en Scrum (Ficha 3565476)',
    fecha_descarga: new Date().toISOString(),
    total_archivos: downloadedFiles.length,
    archivos: downloadedFiles
  };

  fs.writeFileSync(path.join(OUT_DIR, '..', 'materiales_index.json'), JSON.stringify(summary, null, 2), 'utf8');

  log(`\n✅ DESCARGA COMPLETADA: ${downloadedFiles.length} archivo(s) guardados en data/sena/scrum/materiales/`);

  await browser.close();
}

main().catch(err => {
  log(`❌ Error fatal: ${err.message}`);
  process.exit(1);
});
