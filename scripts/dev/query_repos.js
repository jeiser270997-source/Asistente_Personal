require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');

const DB_FILE = path.join(__dirname, '..', 'data', 'repos_db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('❌ No hay base de datos. Corre primero: node scripts/scan_all_repos.js');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function keywordPreFilter(repos, query) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const scored = repos.map(r => {
    const txt = `${r.name} ${r.desc} ${r.lang}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (r.name.toLowerCase().includes(w)) score += 3;
      if (r.desc.toLowerCase().includes(w)) score += 2;
      if (txt.includes(w)) score += 1;
    }
    return { ...r, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 30);
}

async function queryRepos(userQuery) {
  const db = loadDB();
  console.log(`🔍 Buscando en ${db.length} repos: "${userQuery}"`);

  const candidates = keywordPreFilter(db, userQuery);
  console.log(`📋 ${candidates.length} candidatos pre-filtrados`);

  if (candidates.length === 0) {
    console.log('😕 Sin resultados.');
    return [];
  }

  const candidateList = candidates.map((r, i) =>
    `${i + 1}. [${r.stars.toLocaleString()}⭐] ${r.name} (${r.lang})\n   ${r.desc.substring(0, 150)}`
  ).join('\n\n');

  const systemPrompt = `Eres un curador de repositorios open source. Te doy una lista de candidatos.
El usuario busca: "${userQuery}"

Selecciona los 5-8 más relevantes. Para cada uno da:
- Por qué es relevante (1 línea)
- Cómo integrarlo en un proyecto personal de automatización tipo "LifeOS"
- Dificultad de integración (Fácil / Media / Difícil)

Responde en español, formato claro.`;

  console.log('🧠 Consultando IA...');
  const response = await askLLM(systemPrompt, [
    { role: 'user', content: `CANDIDATOS:\n\n${candidateList}` }
  ]);

  return {
    query: userQuery,
    candidates: candidates.length,
    recommendations: response?.content || 'Sin respuesta',
    topRepos: candidates.slice(0, 8)
  };
}

if (require.main === module) {
  const q = process.argv.slice(2).join(' ') || 'herramientas de automatización personal y notificaciones';
  queryRepos(q).then(result => {
    console.log('\n' + '═'.repeat(60));
    console.log(result.recommendations);
    console.log('\n═'.repeat(60));
    console.log(`\n📦 DB: ${require(DB_FILE).length.toLocaleString()} repos | ⚡ DeepSeek V4 Flash\n`);
  }).catch(e => { console.error(e); process.exit(1); });
}

// Uso desde cualquier proyecto:
//   const { queryRepos, loadDB } = require('./scripts/query_repos');
//   const result = await queryRepos("bases de datos vectoriales");
//   console.log(result.recommendations);

module.exports = { queryRepos, loadDB };
