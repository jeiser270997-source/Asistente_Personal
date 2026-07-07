const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const LOCAL_REPOS_DIR = process.env.LOCAL_REPOS_DIR || 'E:\\PROYECTOS\\Proyectos_GitHub';
const DB_PATH = path.join(__dirname, '..', 'data', 'bootcamp', 'repos_locales.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'bootcamp', 'repos_mapping.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) { console.log(msg); }

function getGitInfo(repoPath) {
  try {
    const remote = execSync('git remote get-url origin', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();
    const lastCommit = execSync('git log -1 --format=%ci', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();
    const commitCount = execSync('git rev-list --count HEAD', { cwd: repoPath, encoding: 'utf8', timeout: 5000 }).trim();

    let name = '';
    if (remote.includes('github.com')) {
      name = remote.replace(/.*github\.com[:\/]/, '').replace(/\.git$/, '');
    } else {
      name = path.basename(repoPath);
    }

    return { remote, name, branch, lastCommit, commitCount: parseInt(commitCount) };
  } catch {
    return null;
  }
}

function analyzeRepo(repoPath, folderName) {
  const files = [];
  try {
    const walk = (dir, depth) => {
      if (depth > 3) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') && entry.name !== '.github') continue;
          if (entry.name === 'node_modules') continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && depth < 3) walk(full, depth + 1);
          else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            files.push({ name: entry.name, ext, size: fs.statSync(full).size });
          }
        }
      } catch {}
    };
    walk(repoPath, 0);
  } catch {}

  const langs = new Set();
  const langMap = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.rs': 'Rust', '.go': 'Go', '.java': 'Java',
    '.md': 'Markdown', '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
    '.css': 'CSS', '.html': 'HTML', '.vue': 'Vue', '.svelte': 'Svelte',
    '.sh': 'Shell', '.ps1': 'PowerShell', '.bat': 'Batch',
    '.test.ts': 'Test', '.spec.ts': 'Test', '.test.js': 'Test',
  };

  for (const f of files) {
    const lang = langMap[f.ext];
    if (lang) langs.add(lang);
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  return {
    totalFiles: files.length,
    languages: [...langs],
    totalSizeKB: Math.round(totalSize / 1024),
    topFiles: files.filter(f => f.size > 10000).sort((a, b) => b.size - a.size).slice(0, 5)
      .map(f => ({ name: f.name, sizeKB: Math.round(f.size / 1024) }))
  };
}

function classifyRepo(name, folderName) {
  const lower = (name + folderName).toLowerCase();
  const categories = {
    testing: ['playwright', 'cypress', 'vitest', 'testing', 'test', 'jest', 'mocha'],
    typescript: ['typescript', 'type-challenge', 'ts-', '-ts'],
    javascript: ['javascript', 'node', 'nodejs', 'js-', 'nodebestpractices'],
    fundamentals: ['freecodecamp', 'odin-project', 'coding-interview', 'computer-science', 'roadmap'],
    projects: ['realworld', 'build-your-own', 'app-idea', 'retos-programacion'],
    system_design: ['system-design', 'scalability', 'architecture'],
    react: ['react', 'next', 'bulletproof-react'],
    tools: ['git', 'github', 'cli', 'terminal', 'command-line'],
    ai_agents: ['agent', 'skill', 'ollama', 'llm', 'ai-', 'openai', 'langchain', 'openrouter'],
    libraries: ['chart', 'anime', 'shadcn', 'tailwind', 'pdf', 'tldraw'],
    infra: ['docker', 'kubernetes', 'supabase', 'pocketbase', 'dokploy', 'n8n'],
    other: []
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'other';
}

function main() {
  ensureDir(path.dirname(DB_PATH));

  log('═══════════════════════════════════════');
  log('📂 SCANNER DE REPOS LOCALES');
  log('═══════════════════════════════════════');
  log(`Directorio: ${LOCAL_REPOS_DIR}`);

  if (!fs.existsSync(LOCAL_REPOS_DIR)) {
    log(`❌ No existe: ${LOCAL_REPOS_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(LOCAL_REPOS_DIR, { withFileTypes: true });
  const repos = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(LOCAL_REPOS_DIR, entry.name);
    const isGit = fs.existsSync(path.join(fullPath, '.git'));

    if (!isGit) {
      log(`   ⏭ ${entry.name} (no es repo git)`);
      continue;
    }

    const gitInfo = getGitInfo(fullPath);
    const analysis = analyzeRepo(fullPath, entry.name);
    const category = classifyRepo(gitInfo?.name || '', entry.name);

    const repoEntry = {
      folder: entry.name,
      path: fullPath,
      github: gitInfo?.name || 'desconocido',
      remote: gitInfo?.remote || '',
      branch: gitInfo?.branch || '',
      lastCommit: gitInfo?.lastCommit || '',
      commitCount: gitInfo?.commitCount || 0,
      category,
      ...analysis
    };

    log(`   ✓ [${category}] ${entry.name.substring(0, 60)}`);
    repos.push(repoEntry);
  }

  // Save
  fs.writeFileSync(DB_PATH, JSON.stringify({
    escaneado: new Date().toISOString(),
    directorio: LOCAL_REPOS_DIR,
    total: repos.length,
    repos
  }, null, 2));

  // Generate category summary
  const byCategory = {};
  for (const r of repos) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r.folder);
  }

  fs.writeFileSync(MAPPING_PATH, JSON.stringify({
    generado: new Date().toISOString(),
    categorias: byCategory,
    resumen: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length]))
  }, null, 2));

  log(`\n✅ ${repos.length} repos catalogados`);
  log(`📁 DB: ${DB_PATH}`);
  log(`📁 Mapping: ${MAPPING_PATH}`);

  // Summary
  log('\n📊 Por categoria:');
  for (const [cat, items] of Object.entries(byCategory)) {
    log(`   ${cat}: ${items.length}`);
  }
}

main();
