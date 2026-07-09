/**
 * tests/helpers/setup.js
 * Global setup for all vitest tests.
 * Creates a temporary SQLite database for each test file.
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');

// Track temp files for cleanup
const tempDbs = new Set();

/**
 * Creates a temporary SQLite database for testing.
 * Sets LIFEOS_DB_PATH env var so Database.js uses this path.
 * @returns {{ dbPath: string, cleanup: () => void }}
 */
function createTestDb() {
  const dbPath = path.join(
    os.tmpdir(),
    `lifeos-test-${crypto.randomBytes(4).toString('hex')}.db`
  );
  process.env.LIFEOS_DB_PATH = dbPath;
  tempDbs.add(dbPath);

  return {
    dbPath,
    cleanup() {
      try {
        // Force close any open connections by clearing the module cache
        delete require.cache[require.resolve('../../runtime/stores/Database')];
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
        if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
        tempDbs.delete(dbPath);
      } catch {}
    },
  };
}

// Cleanup all temp databases after each test file
afterAll(() => {
  for (const dbPath of tempDbs) {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    } catch {}
  }
  tempDbs.clear();
});

module.exports = { createTestDb };
