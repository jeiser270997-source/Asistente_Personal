/**
 * runtime-audit.js
 *
 * Modos:
 *   --ci        Modo guardrail: busca accesos directos a estado mutable (exit 1 si hay)
 *   --full      Auditoría completa: CI + integrity + orphan jobs + schema (default)
 *
 * Uso en CI:
 *   node scripts/runtime-audit.js --ci
 *   npm run runtime:audit
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const R = (p) => require(path.join(BASE_DIR, p));
const IS_CI = process.argv.includes('--ci');
const IS_FULL = process.argv.includes('--full') || !IS_CI;

let errors = 0;
let warnings = 0;

function fail(msg) { console.error('  FAIL ' + msg); errors++; }
function warn(msg) { console.warn('  WARN ' + msg); warnings++; }
function ok(msg) { console.log('  OK  ' + msg); }

// ── Mutable state files that MUST go through Stores ──
const MUTABLE_STATE = [
  'aplicaciones.json',
  'masterledger.json',
  'ultima_consulta.json',
  'alertas.json',
  'recordatorios_enviados.json',
  'seguimiento.json',
  'historial_ejecuciones.json',
  'deadlines.json',
  'computrabajo_last.json',
];

// ── Directories allowed to access JSON directly ──
const ALLOWED_DIRS = [
  'runtime',
  'node_modules',
  'tests',
  '.git',
  'data/artifacts/jobs/cv_tailored',
  'data/sources/sena/materiales',
  'data/resume_template',
  'data/cache/dian',          // cache: per-section .txt and _tablas.json
  'logs',
  'docs',
];

// ── 1. Guardrail: detect direct fs access to mutable state ──

function isAllowedDir(filePath) {
  return ALLOWED_DIRS.some(d => filePath.startsWith(path.resolve(BASE_DIR, d)));
}

function scanFile(filePath) {
  const relative = path.relative(BASE_DIR, filePath);
  if (isAllowedDir(filePath)) return;
  if (!filePath.endsWith('.js')) return;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect fs.readFileSync / fs.writeFileSync
      const fsCalls = line.match(/(?:readFileSync|writeFileSync)\s*\(\s*([^)]+)\)/g);
      if (!fsCalls) continue;

      for (const call of fsCalls) {
        // Try to extract the path argument (first argument)
        const argsMatch = call.match(/\((.*?)\)/);
        if (!argsMatch) continue;
        const args = argsMatch[1].split(',').map(a => a.trim().replace(/['"]/g, ''));
        if (!args.length) continue;

        const resolved = args[0];
        // Check if the path (or its basename) matches a mutable state file
        for (const stateFile of MUTABLE_STATE) {
          if (resolved.includes(stateFile) || resolved.endsWith(stateFile)) {
            fail(`${relative}:${i + 1} — direct access to '${stateFile}' (use Store instead)`);
          }
        }
      }
    }
  } catch (e) {
    warn(`cannot read ${relative}: ${e.message}`);
  }
}

function scanFsAccess() {
  console.log('\n=== Guardrail: Direct FS access to mutable state ===');
  const dirs = ['scripts', 'lib'];
  for (const dir of dirs) {
    const full = path.join(BASE_DIR, dir);
    if (!fs.existsSync(full)) continue;
    const entries = fs.readdirSync(full, { recursive: true }).filter(e => e.endsWith('.js'));
    for (const entry of entries) {
      scanFile(path.join(full, entry));
    }
  }
}

// ── 2. Integrity check ──

function checkIntegrity() {
  console.log('\n=== Integrity check ===');
  try {
    process.env.STORAGE_DRIVER = 'sqlite';
    const { getDb, close } = R('runtime/stores/Database');

    const integrity = getDb().prepare("PRAGMA integrity_check").get();
    if (integrity && integrity['integrity_check'] === 'ok') ok('integrity_check passed');
    else fail('integrity_check: ' + JSON.stringify(integrity));

    const fkIssues = getDb().prepare("PRAGMA foreign_key_check").all();
    if (fkIssues.length === 0) ok('foreign_key_check: no violations');
    else fail('foreign_key_check: ' + fkIssues.length + ' violations');

    const journal = getDb().prepare("PRAGMA journal_mode").get();
    if (journal && journal['journal_mode'] === 'wal') ok('journal_mode=WAL');
    else warn('journal_mode=' + (journal ? journal['journal_mode'] : '?'));

    close();
  } catch (e) {
    fail('integrity: ' + e.message);
  }
}

// ── 3. Schema version check ──

function checkSchema() {
  console.log('\n=== Schema version ===');
  try {
    process.env.STORAGE_DRIVER = 'sqlite';
    const Meta = R('runtime/stores/MetaStore');
    const version = Meta.schemaVersion();
    ok('schema_version=' + version);
  } catch (e) {
    fail('schema_version: ' + e.message);
  }
}

// ── 4. Orphan jobs ──

function checkOrphanJobs() {
  console.log('\n=== Orphan jobs (running > 1h without finish) ===');
  try {
    process.env.STORAGE_DRIVER = 'sqlite';
    const { getDb } = R('runtime/stores/Database');
    const orphans = getDb().prepare(
      "SELECT id, job_name, started_at FROM job_runs WHERE status = 'running' AND datetime(started_at) < datetime('now', '-1 hour')"
    ).all();
    if (orphans.length === 0) ok('no orphan jobs');
    else {
      warn(orphans.length + ' orphan job(s):');
      for (const o of orphans) {
        warn('  ' + o.job_name + ' (#' + o.id + ') started at ' + o.started_at);
      }
    }
    const { close } = R('runtime/stores/Database'); close();
  } catch (e) {
    warn('orphan check: ' + e.message + ' (DB may not exist yet)');
  }
}

// ── 5. Expected tables ──

function checkTables() {
  console.log('\n=== Expected tables ===');
  const EXPECTED = ['meta', 'checkpoints', 'applications', 'ledger', 'job_runs', 'seguimiento', 'cases', 'availability', 'timeline', 'schema_migrations'];
  try {
    process.env.STORAGE_DRIVER = 'sqlite';
    const { getDb, close } = R('runtime/stores/Database');
    const tables = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    for (const t of EXPECTED) {
      if (tables.includes(t)) ok('table ' + t);
      else fail('table ' + t + ' missing');
    }
    close();
  } catch (e) {
    fail('table check: ' + e.message);
  }
}

// ── Main ──

function main() {
  console.log('Runtime Audit');
  console.log('Mode: ' + (IS_CI ? 'CI (guardrail only)' : IS_FULL ? 'full' : 'CI'));

  scanFsAccess();

  if (IS_FULL) {
    checkSchema();
    checkIntegrity();
    checkOrphanJobs();
    checkTables();
  }

  console.log(`\nAudit complete: ${errors} failures, ${warnings} warnings\n`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
