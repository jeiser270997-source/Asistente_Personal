const fs = require('node:fs');
const path = require('node:path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const OUT = path.join(__dirname, '..', 'data', 'repos_db.json');

const QUERIES = [
  { q: 'stars:>50000',               label: '50k+' },
  { q: 'stars:10000..50000',         label: '10k-50k' },
  { q: 'stars:5000..10000',          label: '5k-10k' },
  { q: 'stars:1000..5000',           label: '1k-5k' },
  { q: 'stars:500..1000',            label: '500-1k' },
];

async function fetchGitHubSearch(query, maxPages = 10) {
  const repos = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`;
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'LifeOS/1.0' };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      if (res.status === 403) {
        console.log(`  ⚠️ Rate limit — usando token?`);
        break;
      }
      if (!res.ok) {
        if (res.status === 422) break;
        continue;
      }
      const data = await res.json();
      if (!data.items || data.items.length === 0) break;

      for (const item of data.items) {
        repos.push({
          name: item.full_name,
          url: item.html_url,
          stars: item.stargazers_count,
          forks: item.forks_count,
          lang: item.language || '?',
          desc: (item.description || '').substring(0, 200),
          topics: item.topics || [],
          updatedAt: item.updated_at
        });
      }
      if (data.items.length < 100) break;
    } catch (e) {
      console.log(`  ⚠️ Error: ${e.message}`);
      break;
    }
  }
  return repos;
}

async function main() {
  const existing = (() => {
    try { if (fs.existsSync(OUT)) return JSON.parse(fs.readFileSync(OUT, 'utf8')); }
    catch {} return [];
  })();

  const seen = new Set(existing.map(r => r.name));
  let total = existing.length;

  console.log(`📦 DB actual: ${total} repos`);
  console.log(`🔑 Token: ${GITHUB_TOKEN ? 'SI (sin rate limit)' : 'NO (60 req/h max)'}`);
  console.log(`🌐 GitHub Search API...\n`);

  for (const { q, label } of QUERIES) {
    process.stdout.write(`  ${label.padEnd(12)} `);
    const repos = await fetchGitHubSearch(q);
    let added = 0;
    for (const r of repos) {
      if (!seen.has(r.name)) {
        existing.push(r);
        seen.add(r.name);
        added++;
      }
    }
    total += added;
    console.log(`+${String(added).padStart(4)} (total: ${total})`);
    if (!GITHUB_TOKEN) await new Promise(r => setTimeout(r, 2000));
  }

  existing.sort((a, b) => b.stars - a.stars);
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
  console.log(`\n✅ ${total} repos (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
