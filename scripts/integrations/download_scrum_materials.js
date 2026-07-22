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

const SCRUM_MODULES = [
  { id: '7973538', title: 'Diseño_Curricular', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973538` },
  { id: '7973539', title: 'Informacion_del_Programa', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973539` },
  { id: '7973541', title: 'Documentos_de_Interes', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973541` },
  { id: '7973547', title: 'Cronograma_Scrum', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973547` },
  { id: '7973550', title: 'Guia_de_Aprendizaje_1', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973550` },
  { id: '7973551', title: 'Componente_Formativo_1_Scrum_Caracteristicas', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973551` },
  { id: '7973552', title: 'AA1-EV01_Historias_de_Usuario', url: `${BASE_URL}/zajuna/mod/assign/view.php?id=7973552` },
  { id: '7973553', title: 'AA2-EV01_Estudio_de_Caso_Roles', url: `${BASE_URL}/zajuna/mod/assign/view.php?id=7973553` },
  { id: '7973554', title: 'Componente_Formativo_2_Planeacion_Agil', url: `${BASE_URL}/zajuna/mod/page/view.php?id=7973554` },
  { id: '7973555', title: 'AA3-EV01_Mapa_Conceptual_Artefactos', url: `${BASE_URL}/zajuna/mod/assign/view.php?id=7973555` },
  { id: '7973556', title: 'AA4-EV01_Scrum_vs_Kanban', url: `${BASE_URL}/zajuna/mod/assign/view.php?id=7973556` },
  { id: '8005430', title: 'Subir_Documento_Identidad', url: `${BASE_URL}/zajuna/mod/assign/view.php?id=8005430` }
];

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
  log('🚀 Descargando TODOS los módulos y materiales del curso de Scrum (Ficha 3565476)...');

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
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.selectOption('select[name="typeDocument"]', 'CC').catch(() => {});
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);

  const btn = await page.$('button[name="form_login_user"]');
  if (btn) {
    await page.evaluate(() => {
      const modal = document.querySelector('#connection-guard-modal');
      if (modal) modal.remove();
    }).catch(() => {});

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
      page.evaluate(b => b.click(), btn).catch(() => btn.click({ force: true }))
    ]);
  } else {
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(3000);

  const downloadedList = [];

  for (let i = 0; i < SCRUM_MODULES.length; i++) {
    const mod = SCRUM_MODULES[i];
    log(`[${i+1}/${SCRUM_MODULES.length}] Escaneando módulo: "${mod.title}" (${mod.id})...`);

    await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Save page HTML/Text content for offline reference
    const pageText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(OUT_DIR, `${mod.title}_contenido.txt`), pageText, 'utf8');

    // Extract all downloadable PDF or resource links on this module page
    const fileLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="file.php"], a[href*="pluginfile.php"], a[href*=".pdf"], a[href*="Repositorio"], iframe[src*=".pdf"], iframe[src*="Repositorio"]'));
      return links.map(l => l.href || l.src).filter(Boolean);
    });

    const uniqueLinks = Array.from(new Set(fileLinks));
    log(`   Encontrados ${uniqueLinks.length} archivo(s) en ${mod.title}`);

    for (let j = 0; j < uniqueLinks.length; j++) {
      const link = uniqueLinks[j];
      let filename = path.basename(new URL(link).pathname).split('?')[0];
      if (!filename || filename.length < 3 || !filename.includes('.')) {
        filename = `${mod.title}_recurso_${j+1}.pdf`;
      }

      const destPath = path.join(OUT_DIR, filename);
      const bytes = await downloadFile(page, link, destPath);
      if (bytes) {
        const kb = Math.round(bytes / 1024);
        log(`   ✓ Guardado (${kb} KB): ${filename}`);
        downloadedList.push({ modulo: mod.title, archivo: filename, size_kb: kb, url: link });
      }
    }
  }

  // Summary
  const summary = {
    curso: 'APLICACION DEL MARCO DE TRABAJO SCRUM PARA PROYECTOS DE DESARROLLO DE SOFTWARE (3565476)',
    fecha_descarga: new Date().toISOString(),
    modulos_procesados: SCRUM_MODULES.length,
    archivos_descargados: downloadedList.length,
    lista_archivos: downloadedList
  };

  fs.writeFileSync(path.join(OUT_DIR, '..', 'materiales_index_completo.json'), JSON.stringify(summary, null, 2), 'utf8');
  log(`\n==================================================`);
  log(`✅ DESCARGA COMPLETA FINALIZADA!`);
  log(`📦 Se procesaron ${SCRUM_MODULES.length} módulos y se descargaron los archivos en:`);
  log(`📂 ${OUT_DIR}`);
  log(`==================================================\n`);

  await browser.close();
}

main().catch(err => {
  log(`❌ Error: ${err.message}`);
  process.exit(1);
});
