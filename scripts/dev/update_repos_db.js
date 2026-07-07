/**
 * update_repos_db.js
 * Actualiza data/repos_db.json fusionando 2 fuentes:
 *   Fuente A: EvanLi/Github-Ranking → CSV diario (sin Playwright)
 *   Fuente B: gitstar-ranking.com   → Playwright (opcional, si está disponible)
 * Estrategia: merge + dedup por nombre, actualiza stars si hay versión más reciente
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', 'data', 'repos_db.json');
const META_PATH = path.join(__dirname, '..', 'data', 'repos_db_meta.json');
const RAW_BASE = 'https://raw.githubusercontent.com/EvanLi/Github-Ranking/master/Data';

// ── Helpers ────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  // Header: rank,item,repo_name,stars,forks,language,repo_url,username,issues,last_commit,description
  const repos = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // CSV safe split (respeta comas dentro de comillas)
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());

    if (cols.length < 4) continue;
    const [rank, , name, starsRaw, forksRaw, lang, url, , , , ...descParts] = cols;
    const stars = parseInt(starsRaw?.replace(/,/g, ''), 10);
    if (!name || isNaN(stars)) continue;

    repos.push({
      name: name.trim(),
      url: url?.trim() || `https://github.com/${name.trim()}`,
      stars,
      forks: parseInt(forksRaw?.replace(/,/g, ''), 10) || 0,
      lang: lang?.trim() || '?',
      desc: descParts.join(',').trim() || '',
      rank: parseInt(rank, 10) || 0,
    });
  }
  return repos;
}

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return []; }
}

function loadMeta() {
  if (!fs.existsSync(META_PATH)) return { lastUpdate: null, sources: [] };
  try { return JSON.parse(fs.readFileSync(META_PATH, 'utf8')); }
  catch { return { lastUpdate: null, sources: [] }; }
}

function saveDB(repos) {
  const sorted = [...repos].sort((a, b) => b.stars - a.stars);
  fs.writeFileSync(DB_PATH, JSON.stringify(sorted, null, 2));
  return sorted.length;
}

function saveMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

function mergeRepos(existing, incoming) {
  const map = new Map();
  // Cargar existentes
  for (const r of existing) map.set(r.name, r);
  let added = 0, updated = 0;
  // Merge nuevos
  for (const r of incoming) {
    if (!map.has(r.name)) {
      map.set(r.name, r);
      added++;
    } else {
      const old = map.get(r.name);
      // Actualizar si cambiaron las estrellas u otros campos
      if (r.stars > old.stars || !old.rank) {
        map.set(r.name, { ...old, ...r });
        updated++;
      }
    }
  }
  return { merged: [...map.values()], added, updated };
}

// ── Fuente A: EvanLi CSV diario ────────────────────────────────
async function fetchEvanLi() {
  // Intentar últimos 3 días para garantizar disponibilidad
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  for (const date of dates) {
    const url = `${RAW_BASE}/github-ranking-${date}.csv`;
    try {
      console.log(`[EvanLi] Intentando ${date}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const text = await res.text();
      const repos = parseCSV(text);
      if (repos.length > 100) {
        console.log(`[EvanLi] ✅ ${date} → ${repos.length} repos`);
        return { repos, date, url };
      }
    } catch (e) {
      console.warn(`[EvanLi] ⚠ ${date}: ${e.message}`);
    }
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔄 Actualizando repos_db.json...\n');

  const existing = loadDB();
  const meta = loadMeta();
  console.log(`📦 DB actual: ${existing.length} repos | Última actualización: ${meta.lastUpdate || 'nunca'}`);

  const sources = [];
  let allNew = [];

  // Fuente A
  console.log('\n📡 Fuente A: EvanLi/Github-Ranking (CSV diario)...');
  const evanli = await fetchEvanLi();
  if (evanli) {
    allNew.push(...evanli.repos);
    sources.push({ name: 'EvanLi', date: evanli.date, count: evanli.repos.length, url: evanli.url });
    console.log(`   ✅ ${evanli.repos.length} repos de ${evanli.date}`);
  } else {
    console.log('   ❌ No se pudo obtener datos de EvanLi');
  }

  if (allNew.length === 0) {
    console.log('\n⚠️ Sin datos nuevos. DB sin cambios.');
    process.exit(0);
  }

  // Merge
  console.log(`\n🔀 Mergeando ${allNew.length} repos nuevos con ${existing.length} existentes...`);
  const { merged, added, updated } = mergeRepos(existing, allNew);

  // Guardar
  const total = saveDB(merged);
  const newMeta = {
    lastUpdate: new Date().toISOString(),
    totalRepos: total,
    sources: [...(meta.sources || []).slice(-10), ...sources],
  };
  saveMeta(newMeta);

  // Reporte
  console.log('\n✅ ACTUALIZACIÓN COMPLETA');
  console.log('═'.repeat(50));
  console.log(`  Repos antes:    ${existing.length}`);
  console.log(`  Repos nuevos:   +${added}`);
  console.log(`  Repos updated:  ~${updated} (stars actualizadas)`);
  console.log(`  Total final:    ${total}`);
  console.log(`  Fuentes: ${sources.map(s => s.name + ' (' + s.date + ')').join(', ')}`);

  // Muestra top 5 por si cambió el ranking
  const topDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log('\n🏆 Top 5 actual:');
  topDb.slice(0, 5).forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.stars.toLocaleString()}⭐] ${r.name}`)
  );
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

module.exports = { fetchEvanLi, mergeRepos, parseCSV };
