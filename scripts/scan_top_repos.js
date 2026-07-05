const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'data', 'top_repos.json');
const MIN_STARS = 5000;
const MAX_PAGES = 5;

async function scrapePage(page, pageNum) {
  console.log(`\n📄 Página ${pageNum}...`);
  try {
    await page.goto(`https://gitstar-ranking.com/repositories?page=${pageNum}`, {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(1500);

    const repos = await page.evaluate(() => {
      const items = document.querySelectorAll('a.list-group-item.paginated_item');
      return Array.from(items).map(item => {
        const href = item.getAttribute('href') || '';
        const name = href.replace(/^\//, '');
        const desc = item.querySelector('.repo-description')?.textContent?.trim() || '';
        const lang = item.querySelector('.repo-language span')?.textContent?.trim() || '?';
        const text = item.textContent || '';
        const m = text.match(/(\d[\d,]{3,9})\s*$/m);
        const stars = m ? parseInt(m[1].replace(/,/g, '')) : 0;
        return { name, url: `https://github.com/${name}`, desc, stars, lang: lang === 'No language available' ? '?' : lang };
      }).filter(r => r.name && r.stars >= 5000);
    });

    console.log(`   +${repos.length} repos (${MIN_STARS}+ stars)`);
    return repos;
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    return [];
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });

  let all = [];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const repos = await scrapePage(page, p);
    all.push(...repos);
    if (repos.length === 0) break;
  }
  await browser.close();

  all = all.sort((a, b) => b.stars - a.stars).filter((r, i, arr) => arr.findIndex(x => x.url === r.url) === i);
  console.log(`\n📊 Total: ${all.length} repos con ${MIN_STARS}+ estrellas`);

  fs.writeFileSync(OUT, JSON.stringify(all, null, 2));

  const TOPICS = [
    { tag: '🤖 AI / Agentes', kw: ['agent', 'llm', 'ai', 'gpt', 'langchain', 'rag', 'chatgpt', 'openai', 'deepseek', 'gemini', 'copilot', 'autonomous', 'langgraph'] },
    { tag: '📧 Email / Gmail', kw: ['email', 'gmail', 'mail', 'inbox', 'smtp', 'imap'] },
    { tag: '🤖 Telegram / Bots', kw: ['telegram', 'bot', 'chatbot', 'messenger', 'whatsapp'] },
    { tag: '⚡ Automatización', kw: ['automation', 'workflow', 'cron', 'scheduler', 'orchestrat', 'n8n', 'zapier', 'ifttt', 'pipeline'] },
    { tag: '📋 Tareas / Notas', kw: ['task', 'todo', 'note', 'notion', 'obsidian', 'markdown', 'productivity', 'journal'] },
    { tag: '🔧 CLI / Terminal', kw: ['cli', 'terminal', 'shell', 'tui', 'bash'] },
    { tag: '🏠 Self-Hosted', kw: ['self-host', 'selfhost', 'homelab', 'docker', 'self_hosted'] },
    { tag: '📊 Dashboard / UI', kw: ['dashboard', 'ui', 'frontend', 'react', 'vue', 'admin'] },
    { tag: '🔍 Scraping / Browser', kw: ['scrap', 'crawl', 'playwright', 'puppeteer', 'selenium', 'browser'] },
    { tag: '🧠 Memoria / Vector', kw: ['memory', 'vector', 'embedding', 'chroma', 'pinecone', 'pgvector', 'qdrant'] }
  ];

  console.log('\n🎯 RELEVANTES PARA LIFEOS');
  console.log('═'.repeat(65));
  for (const topic of TOPICS) {
    const matches = all.filter(r => {
      const txt = `${r.name} ${r.desc}`.toLowerCase();
      return topic.kw.some(k => txt.includes(k));
    }).slice(0, 3);
    if (matches.length > 0) {
      console.log(`\n${topic.tag}:`);
      for (const r of matches) {
        console.log(`  ⭐ ${r.stars.toLocaleString()} — ${r.name}`);
      }
    }
  }

  console.log(`\n\n💾 ${all.length} repos guardados en data/top_repos.json`);
}
main().catch(e => { console.error(e); process.exit(1); });
