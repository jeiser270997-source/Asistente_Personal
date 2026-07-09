const fs = require('fs');
const path = require('path');

const scripts = [
  'scripts/integrations/email_processor.js',
  'scripts/integrations/telegram_listener.js',
  'scripts/maintenance/reflexion_nocturna.js',
  'scripts/schedulers/brain_orchestrator.js',
  'scripts/integrations/moodle_sena_scraper.js',
  'scripts/integrations/simit_scraper.js',
  'scripts/diagnostics/healthcheck.js',
  // 'scripts/integrations/recordatorio_deepseek.js',  // DEPRECATED — reemplazado por multi-proveedor
  'scripts/integrations/inbox_sensor.js',
  'scripts/integrations/dian_scraper.js',
  'lib/memory/memory.js',
  'lib/memory/memory_engine.js',
  'lib/ai/llm_service.js',
  'lib/context/context_resolver.js',
  'lib/context/pending.js',
  'lib/integrations/telegram.js',
  'lib/integrations/google_auth.js',
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
