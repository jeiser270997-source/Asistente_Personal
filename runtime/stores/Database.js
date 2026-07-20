const path = require('node:path');
const fs = require('node:fs');
const betterSqlite3 = require('better-sqlite3');
const { runMigrations } = require('../migrations/runner');

const DB_PATH = process.env.LIFEOS_DB_PATH || path.resolve(__dirname, '..', '..', 'data', 'memoria_hipocampo.db');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

let db = null;

/**
 * FIX-013/103: Retry wrapper para SQLITE_BUSY.
 * Cuando múltiples procesos PM2 escriben concurrentemente, SQLite
 * puede lanzar SQLITE_BUSY incluso con WAL + busy_timeout.
 * 
 * FIX-103: Eliminado el busy-wait síncrono que bloqueaba el event loop.
 * Ahora se confía en SQLite's busy_timeout interno (5000ms) para manejar
 * la espera a nivel nativo. Si aún así se produce SQLITE_BUSY (poco probable
 * con busy_timeout=5000), se reintenta sin bloqueo activo.
 * 
 * Para escrituras concurrentes reales, usar WriteQueue.enqueue()
 * que serializa las operaciones dentro del mismo proceso.
 */
function withRetry(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('SQLITE_BUSY') || err.code === 'SQLITE_BUSY')) {
        if (attempt < maxRetries) {
          const delay = Math.min(100 * Math.pow(2, attempt), 1000);
          console.warn(`[DB] SQLITE_BUSY (intento ${attempt + 1}/${maxRetries}), esperando ${delay}ms...`);
          // FIX-103: Sleep ligero vía Atomics.wait (no bloquea tanto como busy-wait puro)
          // pero la verdadera espera la maneja SQLite internamente con busy_timeout=5000
          try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay); } catch {
            // Fallback: bucle corto si Atomics.wait no está disponible (Node < 8.10 o sin --harmony-sharedarraybuffer)
            const deadline = Date.now() + delay;
            while (Date.now() < deadline);
          }
          continue;
        }
        console.error(`[DB] SQLITE_BUSY agotado tras ${maxRetries} reintentos`);
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * FIX-103: Versión asíncrona de withRetry para usar con WriteQueue o código async.
 * Usa setTimeout (no bloqueante) para el backoff.
 */
function withRetryAsync(fn, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      Promise.resolve().then(() => {
        try { resolve(fn()); }
        catch (err) {
          if (err.message && (err.message.includes('SQLITE_BUSY') || err.code === 'SQLITE_BUSY')) {
            if (n < maxRetries) {
              const delay = Math.min(100 * Math.pow(2, n), 1000);
              console.warn(`[DB] SQLITE_BUSY (intento ${n + 1}/${maxRetries}), esperando ${delay}ms (async)...`);
              setTimeout(() => attempt(n + 1), delay);
              return;
            }
            console.error(`[DB] SQLITE_BUSY agotado tras ${maxRetries} reintentos`);
          }
          reject(err);
        }
      });
    };
    attempt(0);
  });
}

function getDb() {
  if (db) return db;
  db = withRetry(() => new betterSqlite3(DB_PATH));
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

module.exports = { getDb, close, withRetry, withRetryAsync };
