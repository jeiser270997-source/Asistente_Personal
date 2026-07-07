/**
 * stress_concurrency.js
 * 
 * Lanza N workers en paralelo (cada uno en su propio proceso con su propia
 * conexion SQLite) y verifica que WAL maneje correctamente la concurrencia.
 * 
 * Tests:
 *   1. Checkpoint leido por todos
 *   2. Todos insertan mismo URL → solo 1 app (INSERT OR IGNORE)
 *   3. Cada worker crea app unica → total = N
 *   4. Checkpoint actualizado concurrentemente → ids crecen monotonicamente
 *   5. Ledger eventos concurrentes → total = N * events_por_worker
 * 
 * Uso: node tests/stress_concurrency.js [--workers=4]
 */

const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '..', 'runtime', 'lifeos.db');
const DB_BACKUP = DB_PATH + '.stress_bak';

const NUM_WORKERS = parseInt((process.argv.find(a => a.startsWith('--workers=')) || '--workers=4').split('=')[1]);
const TEST_SEED = Date.now().toString(36);

function log(msg) { console.log('[STRESS] ' + msg); }

// ─── Setup: backup + fresh DB ───
function setup() {
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, DB_BACKUP);
    fs.unlinkSync(DB_PATH);
    log('backed up existing DB, created fresh');
  } else {
    log('no existing DB, creating fresh');
  }
}

function restore() {
  try { require('../runtime/stores/Database').close(); } catch {}
  if (fs.existsSync(DB_BACKUP)) {
    if (fs.existsSync(DB_PATH)) { try { fs.unlinkSync(DB_PATH); } catch {} }
    try { fs.copyFileSync(DB_BACKUP, DB_PATH); } catch (e) { log('restore copy failed: ' + e.message); }
    try { fs.unlinkSync(DB_BACKUP); } catch {}
    log('restored original DB');
  }
}

// ─── Seed initial data ───
function seed() {
  process.env.STORAGE_DRIVER = 'sqlite';
  const CheckpointStore = require('../runtime/stores/CheckpointStore');
  const AppStore = require('../runtime/stores/ApplicationStore');

  // Seed checkpoint with some known IDs
  CheckpointStore.set('computrabajo_last', { ids: ['initial_1', 'initial_2'] });
  const cp = CheckpointStore.get('computrabajo_last');
  log('seeded checkpoint, ids=' + cp.ids.length);
}

// ─── Fork workers ───
async function forkWorker(wid) {
  return new Promise((resolve) => {
    const worker = fork(path.join(__dirname, 'concurrency_worker.js'), [], {
      env: { ...process.env, WORKER_ID: String(wid), NUM_WORKERS: String(NUM_WORKERS), TEST_SEED },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    let stdout = '';
    worker.stdout.on('data', d => { stdout += d.toString(); });
    worker.stderr.on('data', d => process.stderr.write(d));

    worker.on('exit', (code) => {
      const resultMatch = stdout.match(/__RESULT__:(.*)/);
      let result = null;
      if (resultMatch) {
        try { result = JSON.parse(resultMatch[1]); } catch {}
      }
      resolve({ wid, code, stdout, result });
    });
  });
}

// ─── Verify ───
function verify(results, startTs) {
  process.env.STORAGE_DRIVER = 'sqlite';
  const { getDb } = require('../runtime/stores/Database');
  const AppStore = require('../runtime/stores/ApplicationStore');
  const LedgerStore = require('../runtime/stores/LedgerStore');

  const db = getDb();
  let allOk = true;
  const errors = [];

  function check(label, condition, detail) {
    if (condition) {
      log('  OK ' + label);
    } else {
      log('  FAIL ' + label + ': ' + (detail || ''));
      allOk = false;
      errors.push(label);
    }
  }

  log('\n=== VERIFICATION ===');

  // 1. All workers reported OK
  const totalOk = results.filter(r => r.result).reduce((s, r) => s + r.result.ok, 0);
  const totalFail = results.filter(r => r.result).reduce((s, r) => s + r.result.fail, 0);
  check('all workers reported', results.length === NUM_WORKERS, 'got ' + results.length + ' of ' + NUM_WORKERS);
  check('zero worker failures', totalFail === 0, totalFail + ' fails');
  check('all workers ok', totalOk >= NUM_WORKERS * 3, totalOk + ' oks');

  // 2. Race app: only 1 for the race URL
  const raceUrl = `https://computrabajo.com/stress/race_${TEST_SEED}`;
  const raceApps = db.prepare("SELECT COUNT(*) as c FROM applications WHERE url = ?").get(raceUrl);
  check('race URL has 1 app', raceApps.c === 1, 'got ' + raceApps.c);

  // 3. Unique apps: exactly N (one per worker)
  const uniqueApps = db.prepare("SELECT COUNT(*) as c FROM applications WHERE url LIKE '%stress/unique_%'").get();
  check('unique apps count = N', uniqueApps.c === NUM_WORKERS, 'got ' + uniqueApps.c + ', expected ' + NUM_WORKERS);

  // 4. Checkpoint: last-writer-wins es esperado. Verificar estructura válida.
  const cp = db.prepare("SELECT value FROM checkpoints WHERE key = 'computrabajo_last'").get();
  if (cp) {
    const ids = JSON.parse(cp.value).ids || [];
    const workerIds = ids.filter(i => i.includes('_w'));
    check('checkpoint has valid structure', Array.isArray(ids), 'not an array');
    check('checkpoint has initial IDs', ids.includes('initial_1') && ids.includes('initial_2'), 'missing initial IDs');
    check('checkpoint has at least 1 worker', workerIds.length >= 1, 'got ' + workerIds.length);
    check('checkpoint no duplicates', ids.length === new Set(ids).size, 'duplicates found');
  } else {
    check('checkpoint exists', false, 'checkpoint row missing');
  }

  // 5. Ledger: exactly N * 3 events
  const ledgerEvents = db.prepare("SELECT COUNT(*) as c FROM ledger WHERE tipo = 'stress_test'").get();
  check('ledger events = N*3', ledgerEvents.c === NUM_WORKERS * 3, 'got ' + ledgerEvents.c + ', expected ' + (NUM_WORKERS * 3));

  // 6. No WAL corruption
  const integrity = db.prepare("PRAGMA integrity_check").get();
  check('integrity check', integrity && integrity['integrity_check'] === 'ok', JSON.stringify(integrity));

  // 7. WAL mode active
  const journal = db.prepare("PRAGMA journal_mode").get();
  check('WAL mode', journal && journal['journal_mode'] === 'wal', JSON.stringify(journal));

  const elapsed = Date.now() - startTs;
  log('\n=== STRESS TEST ' + (allOk ? 'PASSED' : 'FAILED') + ' (' + elapsed + 'ms) ===');
  if (errors.length) log('Errors: ' + errors.join(', '));

  return allOk;
}

// ─── Main ───
async function main() {
  const startTs = Date.now();
  log('STRESS TEST: ' + NUM_WORKERS + ' workers, seed=' + TEST_SEED);

  setup();
  seed();

  log('forking ' + NUM_WORKERS + ' workers...');
  const promises = [];
  for (let i = 1; i <= NUM_WORKERS; i++) {
    promises.push(forkWorker(i));
  }
  const results = await Promise.all(promises);

  const passed = verify(results, startTs);
  restore();
  process.exit(passed ? 0 : 1);
}

main().catch(e => {
  console.error('FATAL:', e);
  restore();
  process.exit(1);
});
