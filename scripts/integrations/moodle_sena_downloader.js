require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data', 'sena');
const MAT_DIR = path.join(DATA_DIR, 'materiales');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function downloadViaFetch(page, fileUrl, destPath) {
  try {
    const result = await page.evaluate(async (url) => {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (blob.size < 500) return null; // ignore tiny files (errors/redirects)
      const arrayBuf = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuf));
      return { bytes, size: blob.size };
    }, fileUrl);

    if (!result) return false;

    const buf = Buffer.from(result.bytes);
    fs.writeFileSync(destPath, buf);
    return result.size;
  } catch (err) {
    return false;
  }
}

async function main() {
  ensureDir(MAT_DIR);

  log('═══════════════════════════════════════');
  log('📚 SENA PDF DOWNLOADER v2');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // Login
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000); // Dar tiempo a que el spinner desaparezca

  // Cerrar modal intrusivo de "Conexión inestable" si aparece
  try {
    const modalTitle = page.locator('text="Conexión a internet inestable"').first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ⚠ Modal detectado, intentando cerrar...');
    await page.keyboard.press('Escape'); // Forma universal de cerrar modales
    await page.waitForTimeout(1000);
    // Plan B si el escape no funciona:
    if (await modalTitle.isVisible()) {
        const closeBtn = page.locator('img[src*="close"], svg, .close, button.close, [aria-label="Cerrar"], [aria-label="Close"]').first();
        await closeBtn.click({ force: true });
    }
  } catch (e) {
    // Si no aparece el modal, continuamos tranquilos
  }

  // Nuevo login usando placeholders y roles (más resiliente a cambios)
  const selectLocator = page.locator('select').first();
  await selectLocator.waitFor({ state: 'visible', timeout: 15000 });
  try {
    await selectLocator.selectOption({ label: 'Cédula de Ciudadanía' });
  } catch (e) {
    try { await selectLocator.selectOption('CC'); }
    catch (err) { await selectLocator.selectOption({ index: 1 }); }
  }

  await page.getByPlaceholder(/Ingresa el Documento/i).fill(USER);
  await page.getByPlaceholder(/Ingresa la Contraseña/i).fill(PASS);
  
  const btn = page.locator('button:has-text("Iniciar sesión"), a:has-text("Iniciar sesión"), .btn:has-text("Iniciar sesión")').first();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
    btn.click()
  ]);
  await page.waitForTimeout(2000);
  log('✅ Login OK');

  // Load course data
  const cursoPath = path.join(DATA_DIR, 'curso.json');
  const course = JSON.parse(fs.readFileSync(cursoPath, 'utf8'));

  const allFiles = [];
  const pages = [];

  for (const sec of course.secciones) {
    for (const act of sec.actividades) {
      if (act.url) {
        pages.push({ ...act, seccion: sec.nombre });
      }
    }
  }

  log(`Total pages to scan: ${pages.length}\n`);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const shortName = (p.nombre || '').substring(0, 60).trim();
    log(`[${i + 1}/${pages.length}] ${p.tipo.toUpperCase()} | ${shortName}`);

    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Extract ALL resource links: onclick window.open, href to Repositorio, file.php links
    const resources = await page.evaluate(() => {
      const main = document.querySelector('[role="main"], #region-main, .page-content') || document.body;
      const found = [];

      // 1. onclick="window.open(...)" patterns
      const allEls = main.querySelectorAll('*');
      for (const el of allEls) {
        const onclick = el.getAttribute('onclick') || '';
        const matches = onclick.matchAll(/window\.open\(['"](.+?)['"]/g);
        for (const m of matches) {
          found.push({ url: m[1], source: 'onclick' });
        }
      }

      // 2. Regular links to files in Repositorio
      const links = main.querySelectorAll('a[href*="Repositorio"], a[href$=".pdf"], a[href*="DocArtic"], a[href*="Contenido/DocArtic"]');
      for (const a of links) {
        found.push({ url: a.href, source: 'link' });
      }

      // 3. file.php links (Moodle file proxy)
      const fileLinks = main.querySelectorAll('a[href*="file.php"], a[href*="pluginfile.php"]');
      for (const a of fileLinks) {
        found.push({ url: a.href, source: 'file.php' });
      }

      return found;
    });

    // Also check for window.open in the full page (not just main)
    if (resources.length === 0) {
      const extraResources = await page.evaluate(() => {
        const matches = document.body.innerHTML.matchAll(/window\.open\(['"](.+?)['"]/g);
        return Array.from(matches).map(m => ({ url: m[1], source: 'global_onclick' }));
      });
      resources.push(...extraResources);
    }

    // Deduplicate
    const seen = new Set();
    const unique = resources.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    if (unique.length === 0) {
      log(`   Sin recursos descargables`);
      continue;
    }

    log(`   ${unique.length} recurso(s)`);

    for (const res of unique) {
      let fileUrl = res.url;
      if (fileUrl.startsWith('/')) fileUrl = BASE_URL + fileUrl;

      // Determine filename and type
      const urlPath = new URL(fileUrl).pathname;
      let filename = path.basename(urlPath).split('?')[0];

      // Determine type
      let fileType = 'FILE';
      if (filename.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().includes('docartic')) fileType = 'PDF';
      else if (fileUrl.toLowerCase().includes('ova/') || fileUrl.includes('index.html')) fileType = 'OVA';
      else if (filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc')) fileType = 'DOC';
      else if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) fileType = 'XLS';

      if (!filename || filename.length < 3) {
        // Generate filename from URL path
        const parts = urlPath.split('/').filter(Boolean);
        filename = parts[parts.length - 1] || `material_${Date.now()}.pdf`;
      }
      if (!filename.includes('.')) filename += '.pdf';

      // Create folder per section
      const secSafe = (p.seccion || 'general').replace(/[<>:"/\\|?*]/g, '').trim().substring(0, 40) || 'general';
      const folderPath = path.join(MAT_DIR, secSafe);
      ensureDir(folderPath);

      const destPath = path.join(folderPath, filename);

      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
        const kb = Math.round(fs.statSync(destPath).size / 1024);
        log(`   ✓ Ya existe: ${filename} (${kb} KB)`);
        allFiles.push({ seccion: p.seccion, file: filename, type: fileType, size_kb: kb, source: res.source });
        continue;
      }

      const size = await downloadViaFetch(page, fileUrl, destPath);
      if (size) {
        const kb = Math.round(size / 1024);
        log(`   ✓ ${fileType}: ${filename} (${kb} KB)`);
        allFiles.push({ seccion: p.seccion, file: filename, type: fileType, size_kb: kb, source: res.source, url: fileUrl });
      } else {
        log(`   ✗ Fallo: ${filename}`);
        allFiles.push({ seccion: p.seccion, file: filename, type: fileType, error: 'download_failed', url: fileUrl });
      }
    }
  }

  // Save index
  const index = {
    extraido: new Date().toISOString(),
    curso: course.nombre,
    total: allFiles.length,
    exitosos: allFiles.filter(f => !f.error).length,
    fallidos: allFiles.filter(f => f.error).length,
    archivos: allFiles
  };
  fs.writeFileSync(path.join(DATA_DIR, 'materiales_index.json'), JSON.stringify(index, null, 2));

  log('\n═══════════════════════════════════════');
  log(`✅ ${index.exitosos} archivos descargados`);
  log(`❌ ${index.fallidos} fallidos`);
  log(`📁 ${MAT_DIR}`);
  log('═══════════════════════════════════════');

  await browser.close();
}

main().catch(err => { log(`❌ Fatal: ${err.message}`); console.error(err); process.exit(1); });
