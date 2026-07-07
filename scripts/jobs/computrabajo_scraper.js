require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_DIR = path.resolve(__dirname, '..');
const JOBS_DIR = path.join(BASE_DIR, 'data', 'jobs');
const OUT_PATH  = path.join(JOBS_DIR, 'computrabajo.json');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;
const CT_EMAIL = process.env.COMPUTRABAJO_EMAIL || 'jeiser270997@gmail.com';
const CT_PASS  = process.env.COMPUTRABAJO_PASS  || 'A125%230a';

const SEARCHES = [
  { query: 'qa-automation', label: 'QA Automation' },
  { query: 'quality-assurance', label: 'Quality Assurance' },
  { query: 'tester-software', label: 'Tester Software' },
  { query: 'qa', label: 'QA General' },
];

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
    });
  } catch (e) { log('Telegram error: ' + e.message); }
}

function loadLastJson() {
  try { return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, 'computrabajo_last.json'), 'utf8')); }
  catch { return { ids: [] }; }
}

function loadLast() {
  if (USE_SQLITE) {
    const cp = CheckpointStore.get('computrabajo_last');
    return cp || { ids: [] };
  }
  return loadLastJson();
}

function saveLast(ids) {
  if (USE_SQLITE) {
    CheckpointStore.set('computrabajo_last', { ids });
  } else {
    fs.writeFileSync(path.join(JOBS_DIR, 'computrabajo_last.json'), JSON.stringify({ ids }));
  }
}

async function loginComputrabajo(page) {
  log('Login Computrabajo...');
  await page.goto('https://co.computrabajo.com/candidato/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  try {
    await page.fill('input[name="username"], input[type="email"]', CT_EMAIL, { force: true });
    await page.fill('input[name="password"], input[type="password"]', CT_PASS, { force: true });
    await page.click('button[type="submit"], .js-btn-login', { timeout: 3000 });
    await page.waitForTimeout(3000);
    const ok = page.url().includes('candidato') && !page.url().includes('login');
    log(ok ? '   Login OK' : '   Login sin confirmar (continuando sin sesion)');
  } catch (e) {
    log('   Login saltado: ' + e.message.substring(0, 60));
  }
}

async function scrapeSearch(page, query, label) {
  const url = `https://co.computrabajo.com/trabajo-de-${query}?by=publicationDate`;
  log(`  Buscando: ${label} -> ${url}`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const offers = await page.evaluate((lbl) => {
    const results = [];
    const cards = document.querySelectorAll('article, .offerList article, [class*="offerItem"]');

    if (cards.length > 0) {
      Array.from(cards).slice(0, 15).forEach(card => {
        const titleEl = card.querySelector('h2 a, h3 a, a[title], .js-o-link');
        const compEl  = card.querySelector('p[title], .company, [class*="company"]');
        const locEl   = card.querySelector('span[class*="city"], .location, p + span');
        const dateEl  = card.querySelector('p.fc_base, [class*="date"], span[class*="publi"]');
        if (!titleEl) return;
        const clean = s => (s || '').replace(/\s+/g, ' ').trim();
        results.push({
          titulo:  clean(titleEl.textContent || titleEl.getAttribute('title')),
          empresa: clean(compEl?.getAttribute('title') || compEl?.textContent),
          lugar:   clean(locEl?.textContent),
          fecha:   clean(dateEl?.textContent),
          url:     titleEl.href || '',
          id:      (titleEl.href || '').match(/oferta-([\w-]+)/)?.[1] || Math.random().toString(36).slice(2),
        });
      });
    }

    if (results.length === 0) {
      document.querySelectorAll('a[href*="oferta-"]').forEach((a, i) => {
        if (i >= 15) return;
        const text = a.textContent.trim();
        if (text.length < 5) return;
        results.push({
          titulo: text,
          empresa: '', lugar: '', fecha: '',
          url: a.href,
          id: a.href.match(/oferta-([\w-]+)/)?.[1] || Math.random().toString(36).slice(2),
        });
      });
    }

    return results;
  }, label);

  log(`  -> ${offers.length} ofertas encontradas para "${label}"`);
  return offers.map(o => ({ ...o, categoria: label, scraped_at: new Date().toISOString() }));
}

async function main() {
  log('COMPUTRABAJO SCRAPER - QA Colombia');

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    locale: 'es-CO',
  });
  const page = await ctx.newPage();

  const allOffers = [];

  for (const search of SEARCHES) {
    try {
      const offers = await scrapeSearch(page, search.query, search.label);
      allOffers.push(...offers);
      await page.waitForTimeout(1500);
    } catch (e) {
      log(`  Error en "${search.label}": ${e.message.substring(0, 80)}`);
    }
  }

  await browser.close();

  const seen = new Set();
  const unique = allOffers.filter(o => {
    const key = o.id || o.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const last   = loadLast();
  const lastIds = new Set(last.ids || []);
  const nuevas  = unique.filter(o => !lastIds.has(o.id));

  saveLast(unique.map(o => o.id));

  fs.writeFileSync(OUT_PATH, JSON.stringify({
    fecha: new Date().toISOString(),
    total: unique.length,
    nuevas: nuevas.length,
    ofertas: unique
  }, null, 2));

  log(`${unique.length} ofertas unicas (${nuevas.length} nuevas)`);

  if (nuevas.length > 0) {
    const lines = nuevas.slice(0, 5).map(o =>
      `* <b>${o.titulo}</b>\n  ${o.empresa} | ${o.lugar}\n  <a href="${o.url}">Ver oferta</a>`
    );
    const msg = `💼 <b>${nuevas.length} nuevas ofertas QA en Computrabajo</b>\n\n${lines.join('\n\n')}`;
    await sendTelegram(msg);
    log('Notificacion Telegram enviada');
  } else {
    log('Sin nuevas ofertas desde la ultima consulta');
  }

  log(`Datos en: ${OUT_PATH}`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
