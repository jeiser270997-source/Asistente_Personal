const path = require('path');
const fs = require('fs');

const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'wheel-saver', 'data', 'top_repos.db');
const sqlDb = new Database(dbPath, { readonly: true });
const db = sqlDb.prepare('SELECT name, description as desc, language as lang, stars, url FROM repos').all();
console.log(`\n📦 DB cargada: ${db.length} repos\n`);

// Keywords relevantes para el proyecto LifeOS
const TARGETS = [
  { cat: '🤖 Agente/AI Personal',   kw: ['agent','personal','assistant','life','second brain','jarvis','alfred','autonomous'] },
  { cat: '💾 Memoria/RAG',           kw: ['memory','rag','vector','embedding','knowledge','recall','longterm','memgpt','mem0'] },
  { cat: '📧 Email/Notificaciones',  kw: ['email','gmail','inbox','notification','telegram','alert','cleaner'] },
  { cat: '🧠 LLM/Self-Improving',    kw: ['self-improve','reflexion','self-learning','metacognition','gepa','autoresearch','opencode'] },
  { cat: '📊 Scraping/Automation',   kw: ['scraper','playwright','puppeteer','automation','workflow','cron','scheduler'] },
  { cat: '🔐 Seguridad/Privacidad',  kw: ['privacy','local','offline','self-hosted','sqlite','no-cloud'] },
  { cat: '📈 Finanzas/Productividad',kw: ['finance','budget','productivity','todo','task','habit','tracker']} ,
];

const results = {};
const seen = new Set();

for (const target of TARGETS) {
  results[target.cat] = [];
  for (const repo of db) {
    if (seen.has(repo.name)) continue;
    const text = `${repo.name} ${repo.desc || ''} ${repo.lang || ''}`.toLowerCase();
    const match = target.kw.some(kw => text.includes(kw));
    if (match && repo.stars > 500) {
      results[target.cat].push(repo);
      seen.add(repo.name);
    }
  }
  // Sort by stars, take top 10
  results[target.cat] = results[target.cat]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 10);
}

// Print report
let report = '';
for (const [cat, repos] of Object.entries(results)) {
  report += `\n${cat}\n${'─'.repeat(60)}\n`;
  repos.forEach((r, i) => {
    report += `  ${i+1}. [${r.stars.toLocaleString()}⭐] ${r.name}\n`;
    report += `     ${(r.desc||'').substring(0,100)}\n`;
    report += `     ${r.url}\n\n`;
  });
}

console.log(report);

// Save filtered results
fs.writeFileSync('data/cache/repos_lifeos_filtered.json', JSON.stringify(results, null, 2));
console.log('✅ Guardado en data/cache/repos_lifeos_filtered.json');
