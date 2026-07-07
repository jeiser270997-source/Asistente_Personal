/**
 * runtime/migrate.js — Migration runner
 *
 * Uso: node runtime/migrate.js [--dry-run] [--down-all]
 *
 * Lee runtime/migrations/*.sql ordenado, aplica solo pendientes,
 * registra en tabla schema_migrations, cada migración en transacción.
 */
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const DB_PATH = path.resolve(__dirname, 'lifeos.db');

const DRY_RUN = process.argv.includes('--dry-run');
const DOWN_ALL = process.argv.includes('--down-all');

function log(msg) { console.log('[migrate] ' + msg); }

function getDb() {
  const Database = require(path.join(BASE_DIR, 'runtime/stores/Database'));
  const db = require('better-sqlite3')(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  return db;
}

function ensureMigrationsTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT (datetime('now')),
    checksum TEXT
  )`);
}

function getApplied(db) {
  const rows = db.prepare("SELECT version, name, checksum FROM schema_migrations ORDER BY version").all();
  return new Map(rows.map(r => [r.version, r]));
}

function getPending(db, applied) {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pending = [];
  for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (!match) { log('skip (no version): ' + file); continue; }
    const version = parseInt(match[1], 10);
    if (applied.has(version)) continue;
    pending.push({ version, file });
  }
  return pending;
}

function computeChecksum(sql) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(sql).digest('hex').substring(0, 16);
}

function applyMigration(db, migration) {
  const filePath = path.join(MIGRATIONS_DIR, migration.file);
  const sql = fs.readFileSync(filePath, 'utf8').trim();
  const checksum = computeChecksum(sql);

  log('  apply ' + migration.file + ' (' + checksum + ')...');

  if (DRY_RUN) {
    log('  [dry-run] skipped');
    return;
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)").run(
      migration.version, migration.file, checksum
    );
    db.exec('COMMIT');
    log('  applied');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function main() {
  log('Migration runner');
  log('DB: ' + DB_PATH);

  if (!fs.existsSync(DB_PATH)) {
    log('DB does not exist yet. Run a store operation first to create it.');
    process.exit(1);
  }

  const db = getDb();
  ensureMigrationsTable(db);

  const applied = getApplied(db);
  log('Applied: ' + applied.size + ' migration(s)');

  const pending = getPending(db, applied);
  log('Pending: ' + pending.length + ' migration(s)');

  if (pending.length === 0) {
    log('Schema is up to date.');
    db.close();
    return;
  }

  for (const m of pending) {
    applyMigration(db, m);
  }

  db.close();
  log('Done.');
}

main();
