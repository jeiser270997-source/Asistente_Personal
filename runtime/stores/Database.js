const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const betterSqlite3 = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', '..', 'runtime', 'lifeos.db');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

let db = null;

function getDb() {
  if (db) return db;
  if (process.env.STORAGE_DRIVER === 'json') {
    process.stderr.write('[runtime] WARNING: STORAGE_DRIVER=json is deprecated. Removal target: v2.0\n');
  }
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

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const csum = checksum(sql);

    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(sql);
      db.prepare("INSERT OR IGNORE INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)").run(version, file, csum);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
}

function close() {
  if (db) { db.close(); db = null; }
}

module.exports = { getDb, close };
