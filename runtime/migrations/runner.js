const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MIGRATIONS_DIR = __dirname;

function checksum(sql) {
  return crypto.createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex').substring(0, 16);
}

function legacyChecksum(sql) {
  // Versión anterior sin normalización de \r\n (compatibilidad con migraciones pre-runner.js)
  return crypto.createHash('sha256').update(sql).digest('hex').substring(0, 16);
}

function ensureMigrationsTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT (datetime('now')),
    checksum TEXT
  )`);
}

function listMigrations(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => {
      const match = file.match(/^(\d+)/);
      if (!match) return null;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      return { version: Number.parseInt(match[1], 10), file, sql, checksum: checksum(sql) };
    })
    .filter(Boolean);
}

function getApplied(db) {
  return new Map(
    db.prepare('SELECT version, name, checksum FROM schema_migrations').all()
      .map(row => [row.version, row])
  );
}

function validateAppliedMigrations(applied, migrations) {
  for (const migration of migrations) {
    const existing = applied.get(migration.version);
    if (!existing) continue;
    if (existing.name !== migration.file || (existing.checksum !== migration.checksum && existing.checksum !== legacyChecksum(migration.sql))) {
      throw new Error(
        `Migration ${migration.version} was modified after it was applied ` +
        `(stored ${existing.name}/${existing.checksum}, current ${migration.file}/${migration.checksum})`
      );
    }
  }
}

function runMigrations(db, { migrationsDir = DEFAULT_MIGRATIONS_DIR, dryRun = false, log = () => {} } = {}) {
  ensureMigrationsTable(db);
  const migrations = listMigrations(migrationsDir);
  const applied = getApplied(db);
  validateAppliedMigrations(applied, migrations);
  const pending = migrations.filter(migration => !applied.has(migration.version));

  for (const migration of pending) {
    log(`apply ${migration.file} (${migration.checksum})`);
    if (dryRun) continue;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)')
        .run(migration.version, migration.file, migration.checksum);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return { applied: applied.size, pending: pending.length, migrations };
}


module.exports = { checksum, ensureMigrationsTable, listMigrations, runMigrations, validateAppliedMigrations };
