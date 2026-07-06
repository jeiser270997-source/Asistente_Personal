const fs = require('fs');

const db = JSON.parse(fs.readFileSync('data/repos_db.json', 'utf8'));

// Búsqueda quirúrgica — lo que REALMENTE puede entrar en LifeOS Node.js
const PICKS = [
  // Notificaciones push sin Telegram
  { kw: ['ntfy'], reason: 'Push notifications autohosteadas sin depender de Telegram' },
  // Motor de workflows
  { kw: ['n8n'], reason: 'Orquestador visual de workflows — reemplaza los 10 GitHub Actions con una UI' },
  // Crawl web con LLM integrado
  { kw: ['crawl4ai'], reason: 'Web scraper optimizado para LLMs — mejora SIMIT y DIAN scrapers' },
  // Memos: notas autohosteadas
  { kw: ['memos'], reason: 'Notas autohosteadas — alternativa a notas.md con API REST' },
  // Playwright MCP
  { kw: ['playwright-mcp'], reason: 'MCP server de Playwright — Playwright como tool del agente directamente' },
  // Uptime Kuma
  { kw: ['uptime-kuma'], reason: 'Monitor de salud del sistema visual — reemplaza healthcheck.js básico' },
  // Act - run GH Actions local
  { kw: ['nektos/act'], reason: 'Correr GitHub Actions localmente sin pushear — debug instantáneo' },
  // Mem0
  { kw: ['mem0'], reason: 'Capa de memoria semántica para LLMs — upgrade al memory_engine actual' },
  // GPT4All local
  { kw: ['gpt4all'], reason: 'LLM local completo — fallback offline cuando no hay internet/API' },
  // TrendRadar
  { kw: ['trendradar','trend-radar'], reason: 'Monitor de tendencias multiplatforma — nuevo lóbulo de inteligencia de mercado' },
];

console.log('\n🎯 PICKS QUIRÚRGICOS PARA LIFEOS\n' + '═'.repeat(70));

const found = [];
for (const pick of PICKS) {
  const repo = db.find(r =>
    pick.kw.some(kw =>
      r.name.toLowerCase().includes(kw) ||
      (r.desc||'').toLowerCase().includes(kw)
    )
  );
  if (repo) {
    found.push({ ...repo, reason: pick.reason });
    console.log(`\n✅ [${repo.stars.toLocaleString()}⭐] ${repo.name}`);
    console.log(`   📌 ${pick.reason}`);
    console.log(`   🔗 ${repo.url}`);
    console.log(`   💬 ${(repo.desc||'').substring(0,120)}`);
  }
}

// Búsqueda adicional: herramientas QA/Testing relevantes para bootcamp
console.log('\n\n🎯 BONUS: QA/TESTING para Bootcamp\n' + '═'.repeat(70));
const qa = db
  .filter(r => {
    const t = `${r.name} ${r.desc||''}`.toLowerCase();
    return (t.includes('testing') || t.includes('selenium') || t.includes('cypress') ||
            t.includes('jest') || t.includes('vitest') || t.includes('test automation')) &&
           r.stars > 5000;
  })
  .sort((a,b) => b.stars - a.stars)
  .slice(0,8);

qa.forEach((r,i) => {
  console.log(`\n  ${i+1}. [${r.stars.toLocaleString()}⭐] ${r.name} (${r.lang})`);
  console.log(`     ${(r.desc||'').substring(0,100)}`);
  console.log(`     ${r.url}`);
});

// Stats finales
console.log('\n\n📊 STATS DB');
console.log('═'.repeat(70));
const langs = {};
db.forEach(r => { langs[r.lang||'?'] = (langs[r.lang||'?']||0)+1; });
const top = Object.entries(langs).sort((a,b)=>b[1]-a[1]).slice(0,10);
top.forEach(([l,c]) => console.log(`  ${l}: ${c}`));
console.log(`\n  Total repos: ${db.length}`);
console.log(`  Rango estrellas: ${db[db.length-1].stars} – ${db[0].stars.toLocaleString()}`);

fs.writeFileSync('data/repos_picks.json', JSON.stringify(found, null, 2));
console.log('\n✅ Picks guardados en data/repos_picks.json\n');
