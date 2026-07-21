/**
 * facebook_scraper.js — v2
 * Scrapea páginas públicas de Facebook (midudev, mouredev, theaiempire)
 * buscando posts con links a repos interesantes.
 *
 * Facebook oculta links externos en l.php?u= — el scraper extrae la URL real del parámetro u.
 *
 * Uso: node scripts/integrations/facebook_scraper.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { DIR } = require('../../lib/data/paths');

const PAGES = [
  { nombre: 'midudev',      url: 'https://www.facebook.com/midudev.frontend?locale=es_LA' },
  { nombre: 'mouredev',     url: 'https://www.facebook.com/mouredev?locale=es_LA' },
  { nombre: 'theaiempire',  url: 'https://www.facebook.com/theaiempire?locale=es_LA' },
];

const OUT_DIR = path.join(DIR.ARTIFACTS, 'facebook');
const OUT_FILE = path.join(OUT_DIR, 'repos.json');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

/**
 * Scrapea una página de Facebook buscando posts con links a repos
 */
async function scrapePage(page, pageInfo) {
  log(`🌐 Scrapeando ${pageInfo.nombre}...`);
  await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Cerrar modal de cookies/login si aparece
  try {
    const closeBtn = page.locator('[aria-label="Cerrar"], [aria-label="Close"], [data-testid="cookie-policy-dialog-accept-button"], button:has-text("Permitir todo"), button:has-text("Aceptar todo")').first();
    if (await closeBtn.count() > 0 && await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      log('  🍪 Modal cerrado');
    }
  } catch { /* no hay modal */ }

  // Esperar a que los posts carguen
  await page.waitForSelector('[role="article"]', { timeout: 15000 }).catch(() => {
    log('  ⚠ No se encontraron articles, continuando...');
  });
  await page.waitForTimeout(2000);

  // Scroll down to load more posts
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2000);
  }

  // Extraer todos los links y detectar repos
  const posts = await page.evaluate(() => {
    const results = [];
    const seen = new Set();

    // Obtener todos los links de la página
    const allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach(a => {
      const href = a.href;
      // Facebook envuelve links externos en l.php?u=URL
      const realUrl = (() => {
        try {
          const url = new URL(href);
          // l.facebook.com/l.php?u=REAL_URL  →  extraer el parámetro u
          if (url.hostname.includes('l.facebook.com') || url.pathname.includes('l.php')) {
            const u = url.searchParams.get('u');
            if (u) return decodeURIComponent(u);
          }
          return href;
        } catch { return href; }
      })();

      const isRepo = realUrl.toLowerCase().includes('github.com') ||
                     realUrl.toLowerCase().includes('gitlab.com') ||
                     realUrl.toLowerCase().includes('bitbucket.org');
      if (!isRepo) return;
      if (seen.has(realUrl)) return;
      seen.add(realUrl);

      // Buscar el contenedor del post (role="article")
      let post = a.closest('[role="article"]');
      // Si no hay article, subir hasta 5 niveles buscando un contenedor con texto significativo
      if (!post) {
        post = a.parentElement;
        for (let i = 0; i < 5 && post; i++) {
          if (post.textContent && post.textContent.trim().length > 50) break;
          post = post.parentElement;
        }
      }

      const postText = post ? (post.textContent || '').trim() : '';
      // Limpiar el texto: eliminar cadenas repetidas ("Facebook · Facebook" → "Facebook")
      const cleanText = postText
        .replace(/(Facebook|Midudev|mouredev|theaiempire)(?:\s*[·•.…]\s*\1)+/gi, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      const context = cleanText || a.textContent || '';

      results.push({
        pagina: '',
        repo_url: realUrl,
        texto: context.substring(0, 300),
      });
    });

    return results;
  });

  // Asignar nombre de página
  posts.forEach(p => p.pagina = pageInfo.nombre);

  // Deduplicar por página
  const vistosPagina = new Set();
  const unicos = posts.filter(p => {
    if (vistosPagina.has(p.repo_url)) return false;
    vistosPagina.add(p.repo_url);
    return true;
  });

  log(`   → ${unicos.length} repos encontrados`);
  return unicos;
}

async function main() {
  log('═══════════════════════════════════════════');
  log('🐘 Facebook Repo Scraper v2');
  log('═══════════════════════════════════════════');
  ensureDir(OUT_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();

  // Cargar historial previo
  let historial = [];
  if (fs.existsSync(OUT_FILE)) {
    try { historial = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch {}
  }
  const urlsVistas = new Set(historial.map(p => p.repo_url));

  const todosLosPosts = [];

  for (const p of PAGES) {
    try {
      const posts = await scrapePage(page, p);
      todosLosPosts.push(...posts);
    } catch (e) {
      log(`  ❌ Error en ${p.nombre}: ${e.message.substring(0, 80)}`);
    }
  }

  await browser.close();

  // Filtrar solo nuevos
  const nuevos = todosLosPosts.filter(p => !urlsVistas.has(p.repo_url));
  const totales = [...historial, ...nuevos];

  fs.writeFileSync(OUT_FILE, JSON.stringify(totales, null, 2));
  log(`\n📊 RESULTADOS:`);
  log(`   Nuevos: ${nuevos.length}`);
  log(`   Total acumulado: ${totales.length}`);

  if (nuevos.length > 0) {
    log('\n🔗 REPOS NUEVOS ENCONTRADOS:');
    nuevos.forEach(p => {
      log(`   📌 [${p.pagina}] ${p.repo_url}`);
      if (p.texto) log(`      ${p.texto.substring(0, 150)}`);
      log('');
    });
  } else {
    log('\n   Sin repos nuevos (ya estaban todos en el historial)');
  }

  log(`\n✅ Datos guardados en: ${OUT_FILE}`);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
