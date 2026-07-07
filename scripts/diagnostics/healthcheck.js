const fs = require('node:fs');
const path = require('node:path');

const BASE = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE, 'data');

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

const health = {
  timestamp: new Date().toISOString(),
  checks: {
    simit_scraper: checkFile(path.join(DATA_DIR, 'simit', 'ultima_consulta.json')),
    sena_scraper: checkFile(path.join(DATA_DIR, 'sena', 'curso.json')),
    memoria: checkFile(path.join(DATA_DIR, 'memoria', 'hechos.json'), 72),
    bootcamp: checkFile(path.join(DATA_DIR, 'bootcamp', 'curriculum.json'), 720),
    seguimiento_sena: checkFile(path.join(DATA_DIR, 'sena', 'seguimiento.json'), 168),
    contexto_vital: checkFile(path.join(DATA_DIR, 'contexto_vital.json'), 720),
  },
  resumen: {
    total: 6,
    ok: 0,
    warn: 0,
    err: 0
  }
};

for (const [name, check] of Object.entries(health.checks)) {
  if (check.status === 'ok') health.resumen.ok++;
  else if (check.status === 'warn') health.resumen.warn++;
  else health.resumen.err++;
}

health.score = health.resumen.ok === health.resumen.total ? 100 :
               health.resumen.err === 0 ? 75 :
               health.resumen.ok >= 3 ? 50 : 25;

const auditDir = path.join(DATA_DIR, 'audit');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
fs.writeFileSync(path.join(auditDir, 'health.json'), JSON.stringify(health, null, 2));

console.log(`Health: ${health.resumen.ok}/${health.resumen.total} OK, ${health.resumen.warn} warn, ${health.resumen.err} err`);
console.log(JSON.stringify(health, null, 2));
