require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');

const SEARCHES = [
  'auxiliar-sistemas',
  'soporte-tecnico-software',
  'mesa-de-ayuda',
  'helpdesk',
  'soporte-nivel-1',
  'qa-junior',
  'tester-manual',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();
  const results = [];

  for (const q of SEARCHES) {
    const url = `https://co.computrabajo.com/trabajo-de-${q}?by=publicationDate&l=medellin`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1800);

      const offers = await page.evaluate(() => {
        const cards = document.querySelectorAll('article, [class*="offerItem"]');
        const out = [];
        cards.forEach(card => {
          const a = card.querySelector('h2 a, h3 a, a[title]');
          if (!a) return;
          const titulo  = (a.textContent || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
          const empresa = (card.querySelector('[class*="company"], p[title]')?.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 45);
          const lugar   = (card.querySelector('[class*="city"], [class*="location"]')?.textContent || '').replace(/\s+/g, ' ').trim();
          const fecha   = (card.querySelector('[class*="date"], time, [class*="pubDate"]')?.textContent || '').replace(/\s+/g, ' ').trim();
          if (titulo && a.href) out.push({ titulo, empresa, lugar, fecha, url: a.href });
        });
        return out;
      });

      console.log(`[${q}] ${offers.length} ofertas`);
      results.push(...offers);
    } catch (e) {
      console.log(`[${q}] Error: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(800);
  }

  await browser.close();

  // Deduplicar
  const seen = new Set();
  const unique = results.filter(o => {
    if (seen.has(o.url)) return false;
    seen.add(o.url);
    return true;
  });

  console.log('\n════════════════════════════════════════════════════');
  console.log(`  OFERTAS MEDELLÍN — Auxiliar Sistemas / Soporte TI`);
  console.log('════════════════════════════════════════════════════\n');

  unique.slice(0, 12).forEach((o, i) => {
    console.log(`${String(i+1).padStart(2)}. ${o.titulo}`);
    console.log(`    🏢 ${o.empresa || 'N/A'}  |  📍 ${o.lugar || 'N/A'}  |  📅 ${o.fecha || 'N/A'}`);
    console.log(`    🔗 ${o.url}\n`);
  });

  console.log(`Total encontradas: ${unique.length}`);
})().catch(e => console.error('Fatal:', e.message));
