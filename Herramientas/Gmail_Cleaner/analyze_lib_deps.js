const fs = require('fs');
const path = require('path');

const LIB = 'E:/PROYECTOS/Asistente_Personal/lib';

function getAllJS(dir, basePath = '') {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = basePath ? basePath + '/' + entry.name : entry.name;
    if (entry.isDirectory()) results.push(...getAllJS(full, rel));
    else if (entry.name.endsWith('.js')) results.push(rel);
  }
  return results;
}

function getLocalImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  const regex = /require\(['"]\.\.?\/[^'"]+['"]\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    imports.push(m[0].replace(/^require\(['"]/, '').replace(/['"]\)$/, ''));
  }
  return imports;
}

function resolveImport(fromFile, importPath) {
  const fromDir = path.dirname(path.join(LIB, fromFile));
  const resolved = path.resolve(fromDir, importPath);
  const rel = path.relative(LIB, resolved).replace(/\\/g, '/');
  // Try .js extension
  if (fs.existsSync(resolved + '.js')) return rel + '.js';
  if (fs.existsSync(resolved)) return rel;
  // Try index.js
  if (fs.existsSync(path.join(resolved, 'index.js'))) return rel + '/index.js';
  return null;
}

const files = getAllJS(LIB);
console.log('Total archivos en lib/: ' + files.length);
console.log('');

// Build dependency graph
const deps = {};
const reverseDeps = {};

for (const file of files) {
  const filePath = path.join(LIB, file);
  const rawImports = getLocalImports(filePath);
  deps[file] = [];
  reverseDeps[file] = reverseDeps[file] || [];

  for (const imp of rawImports) {
    const resolved = resolveImport(file, imp);
    if (resolved) {
      deps[file].push(resolved);
      if (!reverseDeps[resolved]) reverseDeps[resolved] = [];
      reverseDeps[resolved].push(file);
    }
  }
}

// 1. Print dependency graph
console.log('=== GRAFO DE DEPENDENCIAS ===');
for (const file of files) {
  const out = deps[file] || [];
  const inc = reverseDeps[file] || [];
  console.log(file + ' | fan-out: ' + out.length + ', fan-in: ' + inc.length);
  if (out.length > 0) console.log('  -> ' + out.join(', '));
  if (inc.length > 0) console.log('  <- ' + inc.join(', '));
}

// 2. Circular dependencies (simple detection)
console.log('\n=== DEPENDENCIAS CIRCULARES ===');
function findCircular(current, visited, path) {
  if (path.includes(current)) {
    const cycle = path.slice(path.indexOf(current));
    console.log('  CIRCULAR: ' + cycle.join(' -> ') + ' -> ' + current);
    return;
  }
  if (visited.has(current)) return;
  visited.add(current);
  for (const dep of (deps[current] || [])) {
    findCircular(dep, visited, [...path, current]);
  }
}
const visited = new Set();
for (const file of files) {
  findCircular(file, new Set(), []);
}

// 3. Files with high fan-in
console.log('\n=== ALTO FAN-IN (>5) ===');
for (const file of files) {
  const inc = (reverseDeps[file] || []).length;
  if (inc > 5) console.log('  ' + file + ' (fan-in: ' + inc + ')');
}

// 4. Files with high fan-out
console.log('\n=== ALTO FAN-OUT (>5) ===');
for (const file of files) {
  const out = (deps[file] || []).length;
  if (out > 5) console.log('  ' + file + ' (fan-out: ' + out + ')');
}

// 5. Orphan files
console.log('\n=== ARCHIVOS HUERFANOS (sin dependientes) ===');
for (const file of files) {
  if (!reverseDeps[file] || reverseDeps[file].length === 0) {
    console.log('  ' + file + ' (0 dependientes)');
  }
}

// 6. Proposed grouping
console.log('\n=== PROPUESTA DE AGRUPACION ===');
const groups = {
  'ai/': ['decision.js', 'prompts.js', 'llm_service.js'],
  'lobulos/': ['lobulos/frontal.js', 'lobulos/frontal_langchain.js', 'lobulos/hipotalamo.js', 'lobulos/occipital.js', 'lobulos/parietal.js', 'lobulos/parietal_langchain.js', 'lobulos/temporal.js', 'lobulos/temporal_langchain.js'],
  'memory/': ['memory.js', 'memory_engine.js', 'mem0_client.js', 'memos_client.js'],
  'context/': ['context_resolver.js', 'state_snapshot.js', 'pending.js'],
  'integrations/': ['google_auth.js', 'calendar_client.js', 'telegram.js', 'crawl4ai_client.js'],
  'events/': ['event_bus.js', 'event_registry.js'],
  'scheduling/': ['scheduler.js', 'time_scheduler.js'],
  'runtime/': ['sanitize.js', 'rule_engine.js', 'resume_engine.js', 'job_tracker.js'],
  'skills/': ['skill_engine.js'],
  'think/': ['think.js']
};

for (const [group, groupFiles] of Object.entries(groups)) {
  console.log(group);
  for (const f of groupFiles) {
    if (files.includes(f)) console.log('  ' + f);
    else if (f.startsWith('lobulos/')) console.log('  ' + f + ' (ya existe)');
    else console.log('  ' + f + ' (no encontrado)');
  }
}
