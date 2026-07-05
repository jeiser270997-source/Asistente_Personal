const fs = require('node:fs');
const path = require('node:path');

const BASE = 'https://raw.githubusercontent.com/EvanLi/Github-Ranking/master/Top100';
const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust',
  'Java', 'Kotlin', 'Swift', 'Ruby', 'PHP',
  'C', 'CSharp', 'CPP', 'Shell', 'HTML',
  'Dart', 'Elixir', 'Scala', 'Haskell', 'Lua',
  'Zig', 'Julia', 'R'
];

const OUT = path.join(__dirname, '..', 'data', 'repos_db.json');

function parseMarkdownTable(md) {
  const repos = [];
  const lines = md.split('\n');
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('| Ranking')) { inTable = true; continue; }
    if (line.startsWith('| ---')) continue;
    if (!inTable) continue;
    if (!line.startsWith('|')) { inTable = false; continue; }

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 6) continue;

    try {
      const rank = parseInt(cols[0]);
      const nameMatch = cols[1].match(/\[(.+?)\]\(https:\/\/github\.com\/(.+?)\)/);
      if (!nameMatch) continue;
      const name = nameMatch[2];
      const url = `https://github.com/${name}`;
      const stars = parseInt(cols[2].replace(/,/g, ''));
      const forks = parseInt(cols[3].replace(/,/g, ''));
      const lang = cols[4];
      const desc = (cols[6] || '').replace(/<[^>]+>/g, '').trim();

      if (name && stars > 0) {
        repos.push({ name, url, stars, forks, lang, desc });
      }
    } catch {}
  }
  return repos;
}

async function fetchLang(lang) {
  const file = lang === 'CSharp' ? 'CSharp.md' : lang === 'CPP' ? 'CPP.md' : `${lang}.md`;
  const url = `${BASE}/${file}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const md = await res.text();
    const repos = parseMarkdownTable(md);
    for (const r of repos) r.lang = lang;
    return repos;
  } catch (e) {
    console.log(`  ⚠️ ${lang}: ${e.message}`);
    return [];
  }
}

async function main() {
  const existing = (() => {
    try { if (fs.existsSync(OUT)) return JSON.parse(fs.readFileSync(OUT, 'utf8')); }
    catch {} return [];
  })();

  const seen = new Set(existing.map(r => r.name));
  let total = existing.length;

  console.log(`📦 DB actual: ${total} repos`);
  console.log(`🌐 Descargando top 100 por lenguaje...\n`);

  for (const lang of LANGUAGES) {
    process.stdout.write(`  ${lang.padEnd(14)} `);
    const repos = await fetchLang(lang);
    let added = 0;
    for (const r of repos) {
      if (!seen.has(r.name)) {
        existing.push(r);
        seen.add(r.name);
        added++;
      }
    }
    total += added;
    console.log(`+${String(added).padStart(3)} (total: ${total})`);
    await new Promise(r => setTimeout(r, 300));
  }

  existing.sort((a, b) => b.stars - a.stars);
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
  console.log(`\n✅ ${total} repos totales (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
