require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
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

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function htmlToMarkdown(html) {
  // Basic HTML-to-MD converter specific to Moodle content
  let md = html;

  // Remove scripts, styles, comments
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  md = md.replace(/<!--[\s\S]*?-->/g, '');
  md = md.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Tables → MD tables (simple approach - just extract text cells)
  md = md.replace(/<table[^>]*>/gi, '\n');
  md = md.replace(/<\/table>/gi, '\n');
  md = md.replace(/<tr[^>]*>/gi, '');
  md = md.replace(/<\/tr>/gi, '\n');
  md = md.replace(/<t[dh][^>]*>/gi, '| ');
  md = md.replace(/<\/t[dh]>/gi, ' ');

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

  // Basic formatting
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n');

  // Links
  md = md.replace(/<a[^>]*href=["'](.+?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images → just keep alt text
  md = md.replace(/<img[^>]*alt=["'](.+?)["'][^>]*>/gi, '[img: $1]');
  md = md.replace(/<img[^>]*>/gi, '[img]');

  // Paragraphs and line breaks
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/div>/gi, '\n');
  md = md.replace(/<\/li>/gi, '\n');

  // Lists
  md = md.replace(/<li[^>]*>/gi, '\n- ');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Clean up entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));

  // Clean whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.replace(/[ \t]{2,}/g, ' ');
  md = md.replace(/^\s+|\s+$/gm, '');
  md = md.replace(/\n{2,}/g, '\n\n');

  return md.trim();
}

async function extractPageContent(page, pageUrl) {
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Extract content from main area only
  const content = await page.evaluate(() => {
    const main = document.querySelector('[role="main"], #region-main, .page-content, .no-overflow');
    if (!main) return { title: document.title, html: document.body.innerHTML, text: document.body.innerText };

    // Get the title
    const title = document.querySelector('h1, h2')?.textContent?.trim() || document.title;

    // Remove navigation, header, footer from main content
    const clone = main.cloneNode(true);
    const removals = clone.querySelectorAll('.activity-navigation, .nav-link, .modified, ' +
      '.header, .page-context-header, .sr-only, script, style, iframe, ' +
      '.activity-information, .breadcrumb, nav, .backto, .activity-header');
    removals.forEach(el => el.remove());

    return {
      title,
      html: clone.innerHTML,
      text: clone.innerText
    };
  });

  return {
    title: content.title,
    text: content.text.substring(0, 15000), // Cap at 15K chars
    markdown: htmlToMarkdown(content.html)
  };
}

async function main() {
  ensureDir(MAT_DIR);
  log('═══════════════════════════════════════');
  log('📝 SENA HTML → MD CONVERTER');
  log('═══════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.selectOption('select[name="typeDocument"]', 'CC');
  await page.fill('input[name="document"]', USER);
  await page.fill('input[name="password"]', PASS);
  const btn = await page.$('button[name="form_login_user"]');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
    btn.click()
  ]);
  await page.waitForTimeout(2000);
  log('✅ Login OK');

  const cursoPath = path.join(DATA_DIR, 'curso.json');
  const course = JSON.parse(fs.readFileSync(cursoPath, 'utf8'));

  // Only convert PAGINA type items that have real content (skip empty ones)
  const pages = [];
  for (const sec of course.secciones) {
    for (const act of sec.actividades) {
      if (act.tipo !== 'pagina') continue;
      const name = (act.nombre || '').toLowerCase();
      // Skip pages that are just containers for PDFs/OVAs
      if (name.includes('materiales complementarios') ||
          name.includes('documentos de interés') ||
          name.includes('software requerido') ||
          name.includes('biblioteca')) continue;
      pages.push({ ...act, seccion: sec.nombre });
    }
  }

  log(`${pages.length} paginas para convertir a .md\n`);

  const converted = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const shortName = (p.nombre || '').substring(0, 60).trim();
    log(`[${i + 1}/${pages.length}] ${shortName}`);

    try {
      const content = await extractPageContent(page, p.url);

      if (!content.markdown || content.markdown.length < 50) {
        log(`   → Sin contenido textual significativo (${content.markdown.length} chars), saltando`);
        continue;
      }

      // Clean filename
      let filename = shortName
        .replace(/[^a-zA-Z0-9áéíóú ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      if (filename.length > 50) filename = filename.substring(0, 50);

      // Determine section folder
      const secSafe = (p.seccion || 'general')
        .replace(/[<>:"/\\|?*]/g, '')
        .trim()
        .substring(0, 40) || 'general';

      const folderPath = path.join(MAT_DIR, secSafe);
      ensureDir(folderPath);

      const mdPath = path.join(folderPath, `${filename}.md`);
      const mdContent = `# ${content.title || shortName}\n> Fuente: ${p.url}\n> Convertido: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n\n${content.markdown}`;

      fs.writeFileSync(mdPath, mdContent, 'utf8');
      const sizeKB = Math.round(mdContent.length / 1024);
      log(`   ✓ ${filename}.md (${sizeKB} KB)`);
      converted.push({ seccion: p.seccion, file: `${filename}.md`, size_kb: sizeKB });
    } catch (err) {
      log(`   ✗ Error: ${err.message.substring(0, 60)}`);
    }
  }

  // Save conversion index
  fs.writeFileSync(path.join(MAT_DIR, 'indice_md.json'), JSON.stringify({
    extraido: new Date().toISOString(),
    total: converted.length,
    archivos: converted
  }, null, 2));

  log(`\n✅ ${converted.length} archivos .md generados`);
  log(`📁 ${MAT_DIR}`);

  await browser.close();
}

main().catch(err => { log(`❌ ${err.message}`); process.exit(1); });
