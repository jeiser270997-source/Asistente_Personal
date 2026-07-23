require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { uploadFileToDrive, getOrCreateFolder } = require('../../lib/integrations/drive_manager');

const BASE_URL = 'https://zajuna.sena.edu.co';
const USER = process.env.SENA_MOODLE_USER;
const PASS = process.env.SENA_MOODLE_PASS;

const TARGET_DIR = path.join(__dirname, '..', '..', 'data', 'sena', 'bases_datos', 'materiales');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFileName(str) {
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_+/g, '_').substring(0, 100);
}

async function downloadBDCoursePackage() {
  ensureDir(TARGET_DIR);
  console.log('🚀 === PROCESO DE DESCARGA Y ORGANIZACIÓN BASES DE DATOS (FICHA 3549155) ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // 1. Iniciar sesión en Zajuna SENA
  console.log('🔑 1. Autenticando en Zajuna SENA...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.selectOption('select[name="typeDocument"]', 'CC').catch(() => {});
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);

  const btn = await page.$('button[name="form_login_user"]');
  if (btn) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {}),
      page.evaluate(b => b.click(), btn).catch(() => btn.click({ force: true }))
    ]);
  }
  await page.waitForTimeout(5000);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  console.log('   ✅ Sesión iniciada. URL:', page.url());

  // 2. Buscar enlace del curso de Bases de Datos
  console.log('\n🔎 2. Buscando curso "Bases de Datos Generalidades y Sistemas de Gestión"...');
  await page.goto('https://zajuna.sena.edu.co/zajuna/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const courseLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="course/view.php"]'));
    return anchors.map(a => ({
      title: a.innerText.replace(/\s+/g, ' ').trim(),
      href: a.href
    })).filter(a => a.title.toLowerCase().includes('base') || a.title.includes('3549155') || a.title.toLowerCase().includes('gestion'));
  });

  console.log(`   Cursos encontrados (${courseLinks.length}):`, JSON.stringify(courseLinks, null, 2));

  let courseUrl = courseLinks.length > 0 ? courseLinks[0].href : null;

  if (!courseUrl) {
    console.log('   ⚠️ Buscando cualquier curso matriculado...');
    const allCourses = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="course/view.php"]'));
      return anchors.map(a => ({ title: a.innerText.trim(), href: a.href }));
    });
    if (allCourses.length > 0) {
      courseUrl = allCourses[0].href;
      console.log('   Usando primer curso encontrado:', courseUrl);
    }
  }

  const downloadedFiles = [];

  if (courseUrl) {
    console.log(`\n📚 3. Navegando al curso: ${courseUrl}`);
    await page.goto(courseUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Extraer todos los recursos PDF y materiales
    const resources = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="resource/view.php"], a[href*="mod/resource"], a[href*="mod/assign"], a[href*="mod/folder"], a[href*=".pdf"]'));
      return links.map(l => ({
        name: l.innerText.replace(/\s+/g, ' ').trim() || 'Material_BD',
        href: l.href
      })).filter(l => l.href && l.name);
    });

    console.log(`   Recursos/Módulos detectados (${resources.length})`);

    // Descargar/guardar el contenido de la página principal del curso en PDF/HTML y texto
    const courseContentText = await page.innerText('body');
    const overviewPath = path.join(TARGET_DIR, 'Bases_de_Datos_Contenido_General.txt');
    fs.writeFileSync(overviewPath, courseContentText, 'utf8');
    console.log('   ✓ Guardado resumen general de contenidos: Bases_de_Datos_Contenido_General.txt');
    downloadedFiles.push({ path: overviewPath, name: 'Bases_de_Datos_Contenido_General.txt' });

    // Iterar y descargar PDFs o adjuntos
    for (let i = 0; i < Math.min(resources.length, 10); i++) {
      const resItem = resources[i];
      const safeName = sanitizeFileName(resItem.name);
      console.log(`   [${i+1}/${Math.min(resources.length, 10)}] Procesando: ${resItem.name}...`);

      try {
        const subPage = await context.newPage();
        const navRes = await subPage.goto(resItem.href, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
        await subPage.waitForTimeout(2000);

        // Check if there is an embed or pdf link inside
        const pdfUrl = await subPage.evaluate(() => {
          const pdfObject = document.querySelector('object[type="application/pdf"], iframe[src*=".pdf"], embed[type="application/pdf"], a[href*=".pdf"]');
          return pdfObject ? (pdfObject.src || pdfObject.data || pdfObject.href) : null;
        });

        if (pdfUrl) {
          console.log(`     ✓ PDF directo detectado: ${pdfUrl}`);
          const pdfBuffer = await subPage.evaluate(async (url) => {
            const resp = await fetch(url);
            const arrayBuf = await resp.arrayBuffer();
            return Array.from(new Uint8Array(arrayBuf));
          }, pdfUrl).catch(() => null);

          if (pdfBuffer && pdfBuffer.length > 1000) {
            const filePath = path.join(TARGET_DIR, `${safeName}.pdf`);
            fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
            console.log(`     ✅ Guardado PDF: ${safeName}.pdf (${pdfBuffer.length} bytes)`);
            downloadedFiles.push({ path: filePath, name: `${safeName}.pdf` });
          }
        } else {
          // Save module text content
          const text = await subPage.innerText('body');
          const txtPath = path.join(TARGET_DIR, `${safeName}_contenido.txt`);
          fs.writeFileSync(txtPath, text, 'utf8');
          console.log(`     ✓ Guardado contenido textual: ${safeName}_contenido.txt`);
          downloadedFiles.push({ path: txtPath, name: `${safeName}_contenido.txt` });
        }
        await subPage.close();
      } catch (e) {
        console.warn(`     ⚠️ Error al procesar recurso ${resItem.name}:`, e.message);
      }
    }
  }

  await browser.close();

  // 4. Subir archivos descargados a Google Drive carpeta "LifeOS_Backups"
  console.log('\n☁️ 4. Subiendo paquete descargado de Bases de Datos a Google Drive...');
  try {
    const folderId = await getOrCreateFolder('LifeOS_Backups');
    for (const f of downloadedFiles) {
      console.log(`   Subiendo a Drive: ${f.name}...`);
      const res = await uploadFileToDrive(f.path, folderId, f.name);
      console.log(`   ✅ Subido con éxito: ${res.name} (ID: ${res.id})`);
    }
  } catch (err) {
    console.error('⚠️ No se pudo completar la subida a Drive:', err.message);
  }

  console.log('\n==================================================');
  console.log('✅ PAQUETE DE BASES DE DATOS DESCARGADO Y RESPALDADO!');
  console.log(`📦 ${downloadedFiles.length} archivo(s) guardados en local y en Google Drive.`);
  console.log('==================================================\n');
}

downloadBDCoursePackage().catch(console.error);
