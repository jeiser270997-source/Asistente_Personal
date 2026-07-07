process.env.STORAGE_DRIVER = 'sqlite';

const CheckpointStore = require('../runtime/stores/CheckpointStore');
const AppStore = require('../runtime/stores/ApplicationStore');
const LedgerStore = require('../runtime/stores/LedgerStore');

const wid = parseInt(process.env.WORKER_ID, 10);
const total = parseInt(process.env.NUM_WORKERS, 10);
const seed = process.env.TEST_SEED || 'stress';
const ts = Date.now();

function log(msg) {
  process.stdout.write(`[WORKER ${wid}] ${msg}\n`);
}

const RESULTS = { ok: 0, fail: 0, details: [] };

function ok(msg) { RESULTS.ok++; RESULTS.details.push(msg); log('OK ' + msg); }
function fail(msg) { RESULTS.fail++; RESULTS.details.push(msg); log('FAIL ' + msg); }

try {
  // ── Test 1: Read checkpoint ──
  log('--- Test 1: Read checkpoint ---');
  const cp = CheckpointStore.get('computrabajo_last');
  if (cp && Array.isArray(cp.ids)) ok('checkpoint readable, ids=' + cp.ids.length);
  else fail('checkpoint not readable, got=' + JSON.stringify(cp).slice(0, 80));

  // ── Test 2: All workers try to create app with SAME URL (race) ──
  log('--- Test 2: Duplicate race ---');
  const raceUrl = `https://computrabajo.com/stress/race_${seed}`;
  const existing = AppStore.findByUrl(raceUrl);
  if (!existing) {
    AppStore.create({
      source: 'computrabajo',
      empresa: 'StressCorp',
      cargo: 'QA Stress Test',
      url: raceUrl,
      fecha_aplicacion: new Date().toISOString().split('T')[0],
      estado: 'aplicado',
      score: 80,
      extra_data: { lugar: 'Medellin', worker: wid },
      historial: [{ fecha: new Date().toISOString(), evento: 'stress_test' }],
    });
    ok('created race app (worker ' + wid + ')');
  } else {
    ok('race app already existed (worker ' + wid + ')');
  }

  // ── Test 2b: Verify only ONE race app exists ──
  const raceCount = AppStore.getAll().filter(a => a.url === raceUrl).length;
  if (raceCount === 1) ok('race has exactly 1 app');
  else fail('race has ' + raceCount + ' apps (expected 1)');

  // ── Test 3: Each worker creates app with UNIQUE URL ──
  log('--- Test 3: Unique apps ---');
  const uniqueUrl = `https://computrabajo.com/stress/unique_${seed}_w${wid}`;
  AppStore.create({
    source: 'computrabajo',
    empresa: 'StressCorp_' + wid,
    cargo: 'QA Worker ' + wid,
    url: uniqueUrl,
    fecha_aplicacion: new Date().toISOString().split('T')[0],
    estado: 'aplicado',
    score: 70 + wid,
    extra_data: { lugar: 'Medellin', worker: wid },
    historial: [{ fecha: new Date().toISOString(), evento: 'stress_test' }],
  });
  ok('created unique app ' + uniqueUrl.slice(-20));

  // ── Test 4: Update checkpoint concurrently ──
  log('--- Test 4: Checkpoint update ---');
  const current = CheckpointStore.get('computrabajo_last') || { ids: [] };
  current.ids.push('stress_offer_' + seed + '_w' + wid);
  current.ids = [...new Set(current.ids)];
  CheckpointStore.set('computrabajo_last', current);
  ok('checkpoint updated, total ids=' + current.ids.length);

  // ── Test 5: Ledger events ──
  log('--- Test 5: Ledger events ---');
  LedgerStore.emit('stress_test', { worker: wid, seed, ts, step: 'start' });
  LedgerStore.emit('stress_test', { worker: wid, seed, ts, step: 'create' });
  LedgerStore.emit('stress_test', { worker: wid, seed, ts, step: 'checkpoint' });
  ok('emitted 3 ledger events');

  log('--- Worker ' + wid + ' done ---');
  process.stdout.write('__RESULT__:' + JSON.stringify(RESULTS) + '\n');

} catch (e) {
  fail('exception: ' + e.message + '\n' + e.stack);
  process.stdout.write('__RESULT__:' + JSON.stringify(RESULTS) + '\n');
}

process.exit(0);
