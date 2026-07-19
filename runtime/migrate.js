/**
 * runtime/migrate.js — Migration runner (Unified, delega a runner.js)
 *
 * Uso: node runtime/migrate.js [--dry-run]
 *
 * Delega toda la lógica de migración al runner canónico en runtime/migrations/runner.js
 * que maneja checksums, transacciones atómicas y validación de integridad.
 */
const path = require('path');
const fs = require('fs');

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const DB_PATH = path.resolve(__dirname, 'lifeos.db');

const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) { console.log('[migrate] ' + msg); }

function main() {
  log('Migration runner (Unified)');
  log('DB: ' + DB_PATH);

  if (!fs.existsSync(DB_PATH)) {
    log('DB does not exist yet. Run a store operation first to create it.');
    process.exit(1);
  }

  const db = require('better-sqlite3')(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');

  const { runMigrations } = require('./migrations/runner');

  try {
    const result = runMigrations(db, {
      migrationsDir: MIGRATIONS_DIR,
      dryRun: DRY_RUN,
      log: (msg) => log(msg)
    });
    log(`Applied: ${result.applied} | Pending: ${result.pending}`);
  } catch (e) {
    log(`❌ Migration failed: ${e.message}`);
    process.exit(1);
  } finally {
    db.close();
  }
  log('Done.');
}

main();
