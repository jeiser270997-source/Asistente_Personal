const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const betterSqlite3 = require('better-sqlite3');

const DB_PATH = process.env.LIFEOS_DB_PATH || path.resolve(__dirname, '..', '..', 'data', 'memoria_hipocampo.db');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

let db = null;

function getDb() {
  if (db) return db;
  db = new betterSqlite3(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  runMigrations();
  return db;
}

function checksum(sql) {
  return crypto.createHash('sha256').update(sql).digest('hex').substring(0, 16);
}

function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT (datetime('now')),
    checksum TEXT
  )`);

  const applied = new Map(
    db.prepare("SELECT version FROM schema_migrations").all().map(r => [r.version, true])
  );

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (!match) continue;
    const version = parseInt(match[1], 10);
    if (applied.has(version)) continue;

    // Backup antes de migrar (solo si la DB es real, no en tests)
    const backupPath = DB_PATH + '.bak';
    const isTestDb = DB_PATH.includes('lifeos-test-');
    if (!isTestDb && fs.existsSync(DB_PATH) && !fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`[DB] Backup creado: ${backupPath}`);
      } catch (e) {
        console.warn(`[DB] No se pudo crear backup: ${e.message}`);
      }
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const csum = checksum(sql);

    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(sql);
      db.prepare("INSERT OR IGNORE INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)").run(version, file, csum);
      db.exec('COMMIT');
      // Backup exitoso → eliminar respaldo
      if (!isTestDb && fs.existsSync(backupPath)) {
        try { fs.unlinkSync(backupPath); } catch {}
      }
    } catch (e) {
      db.exec('ROLLBACK');
      console.error(`[DB] Migración ${file} FALLÓ. Backup disponible en: ${backupPath}`);
      throw e;
    }
  }
}

function close() {
  if (db) { db.close(); db = null; }
}

module.exports = { getDb, close };
