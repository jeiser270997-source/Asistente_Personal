const fs = require('node:fs');
const path = require('node:path');
const { DIR, PATHS } = require('../../lib/data/paths');

function checkFile(filePath, maxAgeHours = 48) {
  try {
    const stats = fs.statSync(filePath);
    const age = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (age > maxAgeHours) return { status: 'warn', age: age.toFixed(1) + 'h', msg: 'Desactualizado' };
    return { status: 'ok', age: age.toFixed(1) + 'h' };
  } catch {
    return { status: 'err', age: 'N/A', msg: 'Archivo no encontrado' };
  }
}

// Map of canonical checks using PATHS/DIR from paths.js
const checks = {
  simit_scraper:       { path: PATHS.SIMIT_LAST_QUERY,                     maxAge: 48 },
  sena_scraper:        { path: PATHS.SENA_CURSO,                          maxAge: 48 },
  sena_tracking:       { path: PATHS.SENA_TRACKING,                       maxAge: 168 },
  memoria_db:          { path: PATHS.MEMORIA_DB,                          maxAge: 72 },
  bootcamp:            { path: PATHS.BOOTCAMP_CURRICULUM,                 maxAge: 720 },
  contexto_maestro:    { path: PATHS.ESTADO_VIVO,                         maxAge: 720 },
  contexto_vital:      { path: PATHS.VITAL,                               maxAge: 720 },
  simit_alertas:       { path: PATHS.SIMIT_ALERTS,                        maxAge: 48 },
  computrabajo_cache:  { path: PATHS.JOBS_COMPUTRABAJO,                   maxAge: 72 },
};

const health = {
  timestamp: new Date().toISOString(),
  checks: {},
  resumen: { total: Object.keys(checks).length, ok: 0, warn: 0, err: 0 }
};

for (const [name, cfg] of Object.entries(checks)) {
  const result = checkFile(cfg.path, cfg.maxAge);
  health.checks[name] = result;
  if (result.status === 'ok') health.resumen.ok++;
  else if (result.status === 'warn') health.resumen.warn++;
  else health.resumen.err++;
}

health.score = health.resumen.ok === health.resumen.total ? 100 :
               health.resumen.err === 0 ? 75 :
               health.resumen.ok >= health.resumen.total / 2 ? 50 : 25;

// Write health report to DIR.STATE (data/state/audit) instead of scripts/data/
const auditDir = path.join(DIR.STATE, 'audit');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
fs.writeFileSync(path.join(auditDir, 'health.json'), JSON.stringify(health, null, 2));

console.log(`Health: ${health.resumen.ok}/${health.resumen.total} OK, ${health.resumen.warn} warn, ${health.resumen.err} err`);
console.log(`Score: ${health.score}/100`);
console.log(JSON.stringify(health, null, 2));
