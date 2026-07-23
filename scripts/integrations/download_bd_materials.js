require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;

const OUT_DIR = path.join(__dirname, '..', '..', 'data', 'sena', 'bases_datos', 'materiales');
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

async function downloadBDMaterials() {
  log('🚀 Iniciando descargador completo del curso de BASES DE DATOS (Ficha 3549155)...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  log('🔑 Autenticando en SENA Zajuna...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.selectOption('select[name="typeDocument"]', 'CC').catch(() => {});
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);

  const btn = await page.$('button[name="form_login_user"]');
  if (btn) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
      page.evaluate(b => b.click(), btn).catch(() => btn.click({ force: true }))
    ]);
  }
  await page.waitForTimeout(3000);

  log('Navegando a mis cursos...');
  await page.goto(`${BASE_URL}/zajuna/my/courses.php`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(4000);

  // Find course link for Bases de Datos (3549155)
  const bdCourse = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="course/view.php"]'));
    const bd = links.find(l => l.innerText.includes('BASES DE DATOS') || l.innerText.includes('3549155'));
    return bd ? { text: bd.innerText.trim(), href: bd.href } : null;
  });

  let courseUrl = bdCourse ? bdCourse.href : null;
  if (!courseUrl) {
    log('⚠️ No se encontró link directo en my/courses, intentando búsqueda por selector...');
    courseUrl = `${BASE_URL}/zajuna/course/view.php?name=3549155`;
  }

  log(`📚 Navegando al curso de Bases de Datos: ${courseUrl}`);
  await page.goto(courseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(4000);

  // Extract all section module links inside the BD course
  const moduleLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="mod/page"], a[href*="mod/resource"], a[href*="mod/assign"], a[href*="mod/folder"]'));
    return links.map(l => ({ title: l.innerText.replace(/\s+/g, '_').slice(0, 40), href: l.href }));
  });

  log(`🔎 Se encontraron ${moduleLinks.length} módulos/actividades en Bases de Datos.`);

  const downloadedList = [];

  for (let i = 0; i < moduleLinks.length; i++) {
    const mod = moduleLinks[i];
    log(`[${i+1}/${moduleLinks.length}] Procesando: "${mod.title}"...`);

    await page.goto(mod.href, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const pageText = await page.evaluate(() => document.body.innerText);
    const cleanTitle = (mod.title || `modulo_${i+1}`).replace(/[^a-zA-Z0-9_-]/g, '');
    fs.writeFileSync(path.join(OUT_DIR, `${cleanTitle}_contenido.txt`), pageText, 'utf8');

    const fileLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="file.php"], a[href*="pluginfile.php"], a[href*=".pdf"], a[href*="Repositorio"], iframe[src*=".pdf"]'));
      return links.map(l => l.href || l.src).filter(Boolean);
    });

    for (let j = 0; j < fileLinks.length; j++) {
      const link = fileLinks[j];
      let filename = path.basename(new URL(link).pathname).split('?')[0];
      if (!filename || filename.length < 3 || !filename.includes('.')) {
        filename = `${cleanTitle}_recurso_${j+1}.pdf`;
      }

      const destPath = path.join(OUT_DIR, filename);
      const bytes = await downloadFile(page, link, destPath);
      if (bytes) {
        log(`   ✓ Guardado (${Math.round(bytes/1024)} KB): ${filename}`);
        downloadedList.push({ modulo: cleanTitle, archivo: filename });
      }
    }
  }

  log(`\n==================================================`);
  log(`✅ DESCARGA DE BASES DE DATOS COMPLETA!`);
  log(`📂 Guardado en: ${OUT_DIR}`);
  log(`==================================================\n`);

  await browser.close();
}

downloadBDMaterials().catch(err => {
  log(`❌ Error: ${err.message}`);
  process.exit(1);
});
