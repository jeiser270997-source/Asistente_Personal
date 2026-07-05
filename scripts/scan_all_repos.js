const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const DB_FILE = path.join(__dirname, '..', 'data', 'repos_db.json');
const START_PAGE = parseInt(process.argv[2]) || 1;
const MAX_PAGES = parseInt(process.argv[3]) || 50;
const MIN_STARS = parseInt(process.argv[4]) || 0;

async function scrapePage(page, pageNum) {
  process.stdout.write(`\r📄 Página ${pageNum}/${START_PAGE + MAX_PAGES - 1} `);
  try {
    await page.goto(`https://gitstar-ranking.com/repositories?page=${pageNum}`, {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(800);

    const repos = await page.evaluate((minStars) => {
      const items = document.querySelectorAll('a.list-group-item.paginated_item');
      return Array.from(items).map(item => {
        const href = item.getAttribute('href') || '';
        const name = href.replace(/^\//, '');
        const desc = item.querySelector('.repo-description')?.textContent?.trim() || '';
        const lang = item.querySelector('.repo-language span')?.textContent?.trim() || '';
        const text = item.textContent || '';
        const m = text.match(/(\d[\d,]{3,9})\s*$/m);
        const stars = m ? parseInt(m[1].replace(/,/g, '')) : 0;
        return { name, url: `https://github.com/${name}`, desc, stars, lang: lang === 'No language available' ? '?' : lang };
      }).filter(r => r.name && r.stars >= minStars);
    }, MIN_STARS);

    return repos;
  } catch (e) {
    console.log(`\n   ⚠️ Error p${pageNum}: ${e.message}`);
    return [];
  }
}

async function main() {
  const existing = (() => {
    try { if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch {} return [];
  })();

  const seen = new Set(existing.map(r => r.name));
  let newCount = 0;
  let lastStarCount = Infinity;

  console.log(`🦞 Gitstar Scraper — desde página ${START_PAGE}, max ${MAX_PAGES} páginas`);
  console.log(`📦 DB actual: ${existing.length} repos\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  for (let p = START_PAGE; p < START_PAGE + MAX_PAGES; p++) {
    const repos = await scrapePage(page, p);

    if (repos.length === 0) {
      console.log(`\n⏹️ Página ${p} vacía — fin.`);
      break;
    }

    for (const r of repos) {
      if (!seen.has(r.name)) {
        existing.push(r);
        seen.add(r.name);
        newCount++;
      }
    }

    lastStarCount = repos[repos.length - 1]?.stars || 0;

    if (lastStarCount < 1000) {
      console.log(`\n⏹️ Repos < 1000 estrellas alcanzado — fin.`);
      break;
    }
  }

  await browser.close();

  existing.sort((a, b) => b.stars - a.stars);
  fs.writeFileSync(DB_FILE, JSON.stringify(existing, null, 2));

  console.log(`\n\n✅ ${existing.length} repos totales (${newCount} nuevos)`);
  console.log(`💾 ${DB_FILE}`);
  console.log(`📏 ${(fs.statSync(DB_FILE).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(e => { console.error(e); process.exit(1); });
