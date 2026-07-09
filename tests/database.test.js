/**
 * tests/database.test.js
 * Tests for runtime/stores/Database.js — migration runner, WAL mode, checksums, idempotency.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

// Track cleanup
let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
});

afterEach(() => {
  cleanupFn();
});

// Helper to get a fresh Database module
function freshDb() {
  delete require.cache[require.resolve('../runtime/stores/Database')];
  return require('../runtime/stores/Database');
}

// Helper to migration files dir
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'runtime', 'migrations');

describe('Database.js', () => {
  it('should create WAL mode database', () => {
    const { getDb, close } = freshDb();
    const db = getDb();
    const pragma = db.pragma('journal_mode');
    expect(pragma[0]?.journal_mode?.toLowerCase()).toBe('wal');
    close();
  });

  it('should run all pending migrations on first getDb()', () => {
    const { getDb, close } = freshDb();
    const db = getDb();

    // Check schema_migrations table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('schema_migrations');

    // Verify both migrations were applied
    const migrations = db.prepare("SELECT version, name FROM schema_migrations ORDER BY version").all();
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    expect(migrations[0].version).toBe(1);
    expect(migrations[1].version).toBe(2);
  });

  it('should store SHA-256 checksums for each migration', () => {
    const { getDb, close } = freshDb();
    const db = getDb();

    const rows = db.prepare("SELECT version, checksum FROM schema_migrations ORDER BY version").all();
    for (const row of rows) {
      expect(row.checksum).toBeTruthy();
      expect(row.checksum.length).toBe(16); // truncated SHA-256 to 16 chars
    }
    close();
  });

  it('should be idempotent — calling getDb() twice does not re-run migrations', () => {
    const { getDb, close } = freshDb();
    const db1 = getDb();
    const count1 = db1.prepare("SELECT COUNT(*) as c FROM schema_migrations").get().c;

    // Second call returns same singleton
    const db2 = getDb();
    expect(db2).toBe(db1);
    const count2 = db2.prepare("SELECT COUNT(*) as c FROM schema_migrations").get().c;

    expect(count2).toBe(count1);
    close();
  });

  it('should create expected tables after migrations', () => {
    const { getDb, close } = freshDb();
    const db = getDb();

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);

    // From 0001_init.sql
    expect(tableNames).toContain('meta');
    expect(tableNames).toContain('checkpoints');
    expect(tableNames).toContain('applications');
    expect(tableNames).toContain('ledger');
    expect(tableNames).toContain('job_runs');

    // From 0002_context_engine.sql
    expect(tableNames).toContain('cases');
    expect(tableNames).toContain('availability');
    expect(tableNames).toContain('timeline');

    close();
  });
});
