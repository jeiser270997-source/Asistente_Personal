const path = require('node:path');
const fs = require('node:fs');
const betterSqlite3 = require('better-sqlite3');
const { runMigrations } = require('../migrations/runner');

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

  // Backup preventivo antes de migrar (solo si la DB es real, no en tests)
  const backupPath = DB_PATH + '.bak';
  const isTestDb = DB_PATH.includes('lifeos-test-');

  let hasPending = false;
  try {
    const applied = new Set(db.prepare("SELECT version FROM schema_migrations").all().map(r => r.version));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
    hasPending = files.some(f => {
      const match = f.match(/^(\d+)/);
      return match && !applied.has(parseInt(match[1], 10));
    });
  } catch {
    hasPending = true;
  }

  if (hasPending && !isTestDb && fs.existsSync(DB_PATH)) {
    try {
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`[DB] Backup preventivo creado: ${backupPath}`);
    } catch (e) {
      console.warn(`[DB] No se pudo crear backup previo: ${e.message}`);
    }
  }

  try {
    // Delegación formal en el runner canónico (checksums y atomicidad nativas)
    runMigrations(db, {
      migrationsDir: MIGRATIONS_DIR,
      dryRun: false,
      log: (msg) => console.log(`[DB] ${msg}`)
    });

    // Backup exitoso → eliminar respaldo temporal
    if (hasPending && !isTestDb && fs.existsSync(backupPath)) {
      try { fs.unlinkSync(backupPath); } catch {}
    }
  } catch (err) {
    console.error(`[DB] Migración fallida. Backup disponible en: ${backupPath}`);
    throw err;
  }

  return db;
}

function close() {
  if (db) { db.close(); db = null; }
}

module.exports = { getDb, close };
