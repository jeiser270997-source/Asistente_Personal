/**
 * research_loop.js — 5 pasadas sobre 10,600 repos
 * Busca: MCP servers, skills/agentes, code quality, recursos QA, LLM tools
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/cache/repos_db.json', 'utf8'));
console.log(`\n🔬 Research Loop ×5 — ${db.length} repos\n${'═'.repeat(70)}\n`);

function search(keywords, minStars = 200, limit = 12) {
  const scored = [];
  for (const r of db) {
    const txt = `${r.name} ${r.desc || ''} ${r.lang || ''}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (r.name.toLowerCase().includes(kw)) score += 4;
      else if ((r.desc || '').toLowerCase().includes(kw)) score += 2;
      else if (txt.includes(kw)) score += 1;
    }
    if (score > 0 && r.stars >= minStars) scored.push({ ...r, _score: score });
  }
  return scored.sort((a, b) => b.stars - a.stars).slice(0, limit);
}

const results = {};

// ── PASADA 1: MCP Servers ───────────────────────────────────────
results['🔌 MCP Servers'] = search(
  ['mcp','model context protocol','mcp-server','claude mcp','mcp tools'],
  100, 15
);

// ── PASADA 2: AI Agents / Frameworks ───────────────────────────
results['🤖 AI Agent Frameworks'] = search(
  ['agent','agentic','multi-agent','autonomous agent','langchain','langgraph','autogen','crewai'],
  1000, 15
);

// ── PASADA 3: Code Quality / Linting / Security ────────────────
results['🧹 Code Quality & Security'] = search(
  ['linter','lint','code quality','static analysis','sonar','semgrep','eslint','biome','oxc','security scan'],
  500, 12
);

// ── PASADA 4: Skills / Prompts / System Prompts ────────────────
results['📜 Skills / Prompts / System Prompts'] = search(
  ['system prompt','skill','prompt engineering','prompt template','awesome prompt','agent skill','instruction'],
  200, 15
);

// ── PASADA 5: LLM Local / Inference / Embeddings ───────────────
results['🧠 LLM Local / Embeddings / RAG'] = search(
  ['ollama','llm local','embedding','rag','retrieval','vector store','chroma','qdrant','weaviate','llamafile','lmstudio'],
  500, 15
);

// ── Bonus: Telegram Bots / Notif avanzados ─────────────────────
results['📨 Telegram / Notificaciones avanzadas'] = search(
  ['telegram bot','telegram api','bot framework','grammy','telegraf','telebot','notification service'],
  500, 10
);

// ── Bonus: SQLite / Database ligera ────────────────────────────
results['💾 SQLite / Bases ligeras'] = search(
  ['sqlite','libsql','turso','pglite','duckdb','embedded database'],
  300, 10
);

// ── PRINT REPORT ───────────────────────────────────────────────
let report = '';
for (const [cat, repos] of Object.entries(results)) {
  report += `\n${cat}\n${'─'.repeat(70)}\n`;
  if (repos.length === 0) { report += '  (sin resultados)\n'; continue; }
  repos.forEach((r, i) => {
    const stars = r.stars.toLocaleString();
    const desc = (r.desc || '').substring(0, 90);
    const lang = r.lang !== '?' ? ` [${r.lang}]` : '';
    report += `  ${i+1}. [${stars}⭐]${lang} ${r.name}\n`;
    if (desc) report += `     ${desc}\n`;
    report += `     ${r.url}\n\n`;
  });
}

console.log(report);
fs.writeFileSync('data/cache/research/research_loop_results.json', JSON.stringify(results, null, 2));
console.log('✅ Guardado en data/cache/research/research_loop_results.json\n');
