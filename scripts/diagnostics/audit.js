const fs = require('fs');
const path = require('path');

const scripts = [
  'scripts/email_processor.js',
  'scripts/telegram_listener.js',
  'scripts/reflexion_nocturna.js',
  'scripts/brain_orchestrator.js',
  'scripts/moodle_sena_scraper.js',
  'scripts/simit_scraper.js',
  'scripts/healthcheck.js',
  'scripts/recordatorio_deepseek.js',
  'scripts/inbox_sensor.js',
  'scripts/dian_scraper.js',
  'lib/memory.js',
  'lib/memory_engine.js',
  'lib/llm_service.js',
  'lib/context_resolver.js',
  'lib/pending.js',
  'lib/telegram.js',
  'lib/google_auth.js',
  'lib/lobulos/hipotalamo.js',
  'lib/lobulos/frontal.js',
  'lib/lobulos/temporal.js',
  'lib/lobulos/parietal.js',
  'lib/lobulos/occipital.js',
];

const issues = [];
const ok = [];

for (const s of scripts) {
  if (!fs.existsSync(s)) {
    issues.push(`[ARCHIVO FALTANTE] ${s}`);
    continue;
  }
  const dir = path.dirname(s);
  const content = fs.readFileSync(s, 'utf8');
  const reqs = [...content.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)].map(m => m[1]);
  for (const r of reqs) {
    const base = path.resolve(dir, r);
    const exists = fs.existsSync(base) ||
      fs.existsSync(base + '.js') ||
      fs.existsSync(base + '.json') ||
      fs.existsSync(path.join(base, 'index.js'));
    if (!exists) {
      issues.push(`[IMPORT ROTO] ${s} -> require('${r}')`);
    }
  }
  ok.push(s);
}

console.log('\n===== AUDIT REPORT =====');
if (issues.length === 0) {
  console.log('✅ Sin problemas encontrados.');
} else {
  console.log(`❌ ${issues.length} problema(s):\n`);
  issues.forEach(i => console.log(' •', i));
}
console.log(`\n✅ ${ok.length} archivos revisados.`);
