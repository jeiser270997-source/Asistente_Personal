const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = 'E:/PROYECTOS/Asistente_Personal';
const LIB = BASE + '/lib';

// Mapping: old relative path from lib/ -> new relative path from lib/
const moves = {
  'calendar_client.js': 'integrations/calendar_client.js',
  'context_resolver.js': 'context/context_resolver.js',
  'crawl4ai_client.js': 'integrations/crawl4ai_client.js',
  'event_bus.js': 'events/event_bus.js',
  'event_registry.js': 'events/event_registry.js',
  'google_auth.js': 'integrations/google_auth.js',
  'job_tracker.js': 'runtime/job_tracker.js',
  'llm_service.js': 'ai/llm_service.js',
  'mem0_client.js': 'memory/mem0_client.js',
  'memory.js': 'memory/memory.js',
  'memory_engine.js': 'memory/memory_engine.js',
  'memos_client.js': 'memory/memos_client.js',
  'pending.js': 'context/pending.js',
  'resume_engine.js': 'runtime/resume_engine.js',
  'rule_engine.js': 'runtime/rule_engine.js',
  'sanitize.js': 'runtime/sanitize.js',
  'scheduler.js': 'scheduling/scheduler.js',
  'skill_engine.js': 'skills/skill_engine.js',
  'state_snapshot.js': 'context/state_snapshot.js',
  'telegram.js': 'integrations/telegram.js',
  'think.js': 'think/think.js',
  'time_scheduler.js': 'scheduling/time_scheduler.js',
};

// Build old->new mapping for require() paths
// When a file at `from` requires `../lib/old_path`, it becomes `../lib/new_path`
const requireMap = {};
for (const [oldPath, newPath] of Object.entries(moves)) {
  requireMap['./' + oldPath.replace('.js', '')] = './' + newPath.replace('.js', '');
  requireMap['../lib/' + oldPath.replace('.js', '')] = '../lib/' + newPath.replace('.js', '');
  requireMap['lib/' + oldPath.replace('.js', '')] = 'lib/' + newPath.replace('.js', '');
}

// Also add direct variations used in require()
for (const [oldPath, newPath] of Object.entries(moves)) {
  const oldNoExt = oldPath.replace('.js', '');
  const newNoExt = newPath.replace('.js', '');
  // Variations: without .js, with .js, with ./lib/, with ../lib/
  requireMap[oldNoExt] = newNoExt;
  requireMap[oldPath] = newPath;
  requireMap['./' + oldNoExt] = './' + newNoExt;
  requireMap['./' + oldPath] = './' + newPath;
  requireMap['../' + oldNoExt] = '../' + newNoExt;
  requireMap['../' + oldPath] = '../' + newPath;
  requireMap['../../' + oldNoExt] = '../../' + newNoExt;
  requireMap['../../' + oldPath] = '../../' + newPath;
}

// Create directories
const dirs = new Set(Object.values(moves).map(p => path.dirname(p)));
for (const d of dirs) {
  const p = path.join(LIB, d);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log('Created: ' + p);
  }
}

// Move files
for (const [oldPath, newPath] of Object.entries(moves)) {
  const src = path.join(LIB, oldPath);
  const dst = path.join(LIB, newPath);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dst);
    console.log('Moved: ' + oldPath + ' -> ' + newPath);
  } else {
    console.log('SKIP (not found): ' + oldPath);
  }
}

// Update require() paths across ALL .js files in the project
console.log('\nUpdating require() paths...');
const jsFiles = [];
function collectFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('node_modules') && entry.name !== '.git') {
      collectFiles(full);
    } else if (entry.name.endsWith('.js')) {
      jsFiles.push(full);
    }
  }
}
collectFiles(BASE);

let totalUpdated = 0;
for (const file of jsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  for (const [oldP, newP] of Object.entries(requireMap)) {
    // Replace require('...') patterns
    const pattern = "require('" + oldP + "')";
    const replacement = "require('" + newP + "')";
    content = content.split(pattern).join(replacement);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalUpdated++;
    console.log('  Updated: ' + path.relative(BASE, file));
  }
}

console.log('\nDone. Updated ' + totalUpdated + ' files.');
