/**
 * lib/events/event_bus.js — LifeOS Event Bus v3
 *
 * Basado en EventEmitter nativo de Node.js + capa de producción:
 *   - Event envelope con id, timestamp, meta
 *   - Retry con backoff (3 intentos) vía retry-wrapper opcional
 *   - Dead Letter Queue
 *   - Backpressure (máx N handlers concurrentes)
 *   - Idempotencia por content hash
 *   - Persistencia opcional a LedgerStore (SQLite)
 *
 * API pública compatible con v2.
 */

const { EventEmitter } = require('node:events');
const crypto = require('node:crypto');

let LedgerStore = null;
try {
  LedgerStore = require('../../runtime/stores/LedgerStore');
} catch {
  // LedgerStore no disponible — persistencia desactivada
}

let getDb = null;
let OutboxStore = null;
try {
  ({ getDb } = require('../../runtime/stores/Database'));
  OutboxStore = require('../../runtime/stores/OutboxStore');
} catch {
  // Database/OutboxStore no disponibles — outbox desactivado
}

// ── Config ──
const MAX_CONCURRENT = 10;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 500;

// ── Internal state ──
const deadLetters = [];
const processedHashes = new Set();
const MAX_HASH_CACHE = 10000;

const metrics = {
  emitted: 0,
  processed: 0,
  retries: 0,
  failures: 0,
  deduped: 0,
  dlq: 0,
};

// ── Backpressure ──
let concurrent = 0;
const pendingQueue = [];

class LifeOSEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

const emitter = new LifeOSEventBus();

// ── Helpers ──

function createEnvelope(type, payload, meta) {
  return {
    id: `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    type,
    payload,
    timestamp: Date.now(),
    meta: {
      source: meta?.source || 'unknown',
      priority: meta?.priority || 'normal',
      partitionKey: meta?.partitionKey || null,
      version: 1,
    },
  };
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + stableStringify(obj[key]);
  });
  return '{' + parts.join(',') + '}';
}

function contentHash(type, payload) {
  const stable = stableStringify({ type, payload });
  return crypto.createHash('sha1').update(stable).digest('hex').substring(0, 16);
}

function persist(envelope) {
  if (!LedgerStore) return;
  try {
    LedgerStore.emit('event_' + envelope.type.replace(/\./g, '_'), {
      event_id: envelope.id,
      timestamp: envelope.timestamp,
      source: envelope.meta.source,
      priority: envelope.meta.priority,
      ...envelope.payload,
    });
  } catch { /* noop */ }
}

function persistToOutbox(envelope) {
  if (!getDb || !OutboxStore) return;
  try {
    const db = getDb();
    OutboxStore.insert(db, envelope.type, envelope.payload, {
      source: envelope.meta.source,
      priority: envelope.meta.priority,
    });
  } catch (e) {
    console.error(`[EventBus] No se pudo persistir en outbox: ${e.message}`);
  }
}

// ── Log handler execution (structured JSON to stderr) ──

function logHandler(name, eventType, durationMs, status, err) {
  const entry = {
    ts: new Date().toISOString(),
    event: eventType,
    handler: name || 'anonymous',
    duration_ms: durationMs,
    status,
  };
  if (err) entry.error = err.message;
  process.stderr.write(JSON.stringify(entry) + '\n');
}

// ── Dispatch with retry ──

async function dispatch(envelope, handler) {
  concurrent++;
  const start = Date.now();
  const name = handler.name || 'anonymous';
  let lastError;

  try {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        await Promise.resolve(handler(envelope));
        metrics.processed++;
        logHandler(name, envelope.type, Date.now() - start, 'ok');
        return;
      } catch (e) {
        lastError = e;
        metrics.retries++;
        if (attempt < RETRY_ATTEMPTS) {
          logHandler(name, envelope.type, Date.now() - start, 'retry', e);
          await new Promise(r => setTimeout(r, attempt * RETRY_BASE_MS));
        }
      }
    }

    // All retries exhausted → DLQ (máx 100 entradas)
    metrics.failures++;
    metrics.dlq++;
    deadLetters.push({
      envelope,
      error: lastError?.message,
      handler: name,
      handlerRef: handler,
      failedAt: new Date().toISOString(),
    });
    // --- Persistir en DLQ via LedgerStore ---
    try {
      if (LedgerStore) {
        LedgerStore.emit('event_dlq', {
          event_id: envelope.id,
          event_type: envelope.type,
          payload: envelope.payload,
          error_msg: lastError?.message || 'Unknown error',
        });
      }
    } catch(e) { console.error('Error guardando en DLQ:', e.message); }
    // ----------------------------------
    if (deadLetters.length > 100) deadLetters.shift();
    logHandler(name, envelope.type, Date.now() - start, 'dlq', lastError);
  } finally {
    concurrent--;
    flushQueue();
  }
}

function flushQueue() {
  if (pendingQueue.length === 0 || concurrent >= MAX_CONCURRENT) return;
  const highIdx = pendingQueue.findIndex(e => e.envelope.meta.priority === 'high');
  const idx = highIdx >= 0 ? highIdx : 0;
  const item = pendingQueue.splice(idx, 1)[0];
  dispatch(item.envelope, item.handler);
}

// ── Public API ──

function on(eventType, handler) {
  emitter.on(eventType, handler);
  return () => emitter.off(eventType, handler);
}

function once(eventType, handler) {
  emitter.once(eventType, handler);
  return () => emitter.off(eventType, handler);
}

function off(eventType, handler) {
  emitter.off(eventType, handler);
}

function emit(eventType, payload, meta) {
  metrics.emitted++;

  const envelope = createEnvelope(eventType, payload, meta);

  // Idempotency
  const hash = contentHash(eventType, payload);
  if (processedHashes.has(hash)) {
    metrics.deduped++;
    return envelope;
  }
  processedHashes.add(hash);
  if (processedHashes.size > MAX_HASH_CACHE) {
    const first = processedHashes.values().next().value;
    processedHashes.delete(first);
  }

  persist(envelope);
  persistToOutbox(envelope);

  // Use EventEmitter's listenerCount + dispatch
  const listeners = emitter.rawListeners(eventType);
  for (const handler of listeners) {
    if (concurrent < MAX_CONCURRENT) {
      dispatch(envelope, handler);
    } else {
      pendingQueue.push({ envelope, handler });
    }
  }

  return envelope;
}

// ── Dead Letter Queue ──

function getDeadLetters() {
  return [...deadLetters];
}

function retryDeadLetters() {
  const batch = [...deadLetters];
  deadLetters.length = 0;
  for (const dl of batch) {
    if (typeof dl.handlerRef === 'function') {
      // Reintenta SOLO el handler que falló, no todos los listeners del tipo.
      dispatch(dl.envelope, dl.handlerRef);
    }
  }
  return batch.length;
}

// ── Replay ──

function replay(eventType, handler) {
  if (!LedgerStore) return 0;
  try {
    const events = LedgerStore.getByTipo('event_' + eventType.replace(/\./g, '_'));
    for (const ev of events) {
      handler({
        id: ev.event_id,
        type: eventType,
        payload: ev,
        timestamp: ev.timestamp ? new Date(ev.timestamp).getTime() : Date.now(),
        meta: { source: ev.source || 'replay', priority: ev.priority || 'normal', version: 1 },
      });
    }
    return events.length;
  } catch {
    return 0;
  }
}

// ── Metrics ──

function getMetrics() {
  return {
    ...metrics,
    concurrent,
    pending: pendingQueue.length,
    dlq_size: deadLetters.length,
    idempotency_cache: processedHashes.size,
    handlers: Object.fromEntries(
      emitter.eventNames().map(name => [name, emitter.listenerCount(name)])
    ),
  };
}

// Espera a que no queden dispatches en curso ni eventos en la cola de backpressure.
// Úsalo antes de process.exit() en scripts/cron jobs cortos para no perder eventos
// que estén a mitad de un reintento con backoff.
function drain(timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve) => {
    (function check() {
      if ((concurrent === 0 && pendingQueue.length === 0) || Date.now() - start > timeoutMs) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    })();
  });
}

module.exports = { on, once, off, emit, replay, getDeadLetters, retryDeadLetters, getMetrics, drain };
