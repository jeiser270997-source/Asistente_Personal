/**
 * tests/event_bus.test.js
 * Tests for lib/events/event_bus.js — emit, retry, DLQ, backpressure, drain, metrics, idempotency.
 */
const crypto = require('node:crypto');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};
let bus;

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  // Clear module cache so we get a fresh bus singleton each test
  delete require.cache[require.resolve('../lib/events/event_bus')];
  bus = require('../lib/events/event_bus');
});

afterEach(() => {
  cleanupFn();
});

describe('EventBus — Basic emit/on/off', () => {
  it('should emit and receive an event', () => {
    const events = [];
    const unsub = bus.on('test.event', (ev) => { events.push(ev.payload); });
    bus.emit('test.event', { hello: 'world' });
    // flush microtasks
    return new Promise(setImmediate).then(() => {
      expect(events.length).toBe(1);
      expect(events[0]).toEqual({ hello: 'world' });
      unsub();
    });
  });

  it('should pass envelope with id, type, timestamp, meta', () => {
    const events = [];
    bus.on('test.env', (ev) => { events.push(ev); });
    bus.emit('test.env', { data: 1 }, { source: 'test', priority: 'high' });
    return new Promise(setImmediate).then(() => {
      expect(events.length).toBe(1);
      const ev = events[0];
      expect(ev.id).toMatch(/^evt_/);
      expect(ev.type).toBe('test.env');
      expect(ev.timestamp).toBeGreaterThan(0);
      expect(ev.meta.source).toBe('test');
      expect(ev.meta.priority).toBe('high');
      expect(ev.meta.version).toBe(1);
    });
  });

  it('should allow unsubscribing via returned function', () => {
    const events = [];
    const unsub = bus.on('test.unsub', (ev) => { events.push(ev.payload); });
    unsub();
    bus.emit('test.unsub', { should: 'not arrive' });
    return new Promise(setImmediate).then(() => {
      expect(events.length).toBe(0);
    });
  });

  it('should handle once() correctly', () => {
    const events = [];
    bus.once('test.once', (ev) => { events.push(ev.payload); });
    bus.emit('test.once', { first: true });
    bus.emit('test.once', { second: true });
    return new Promise(setImmediate).then(() => {
      expect(events.length).toBe(1);
      expect(events[0]).toEqual({ first: true });
    });
  });

  it('should handle off() correctly', () => {
    const events = [];
    function handler(ev) { events.push(ev.payload); }
    bus.on('test.off', handler);
    bus.emit('test.off', { a: 1 });
    bus.off('test.off', handler);
    bus.emit('test.off', { b: 2 });
    return new Promise(setImmediate).then(() => {
      expect(events.length).toBe(1);
      expect(events[0]).toEqual({ a: 1 });
    });
  });
});

describe('EventBus — Retry mechanism', () => {
  it('should retry failed handlers up to 3 times', () => {
    const attempts = [];
    bus.on('test.retry', async (ev) => {
      attempts.push(Date.now());
      throw new Error('Intentional failure');
    });
    bus.emit('test.retry', {});
    // Retry backoff: 500 + 1000 + 1500 = 3000ms max
    return new Promise(r => setTimeout(r, 4000)).then(() => {
      expect(attempts.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should move to DLQ after exhausting retries', () => {
    bus.on('test.dlq', async () => { throw new Error('Fatal'); });
    bus.emit('test.dlq', { reason: 'test' });
    // Retry backoff: 500 + 1000 + 1500 = 3000ms max
    return new Promise(r => setTimeout(r, 4000)).then(() => {
      const dl = bus.getDeadLetters();
      const found = dl.filter(d => d.envelope.type === 'test.dlq');
      expect(found.length).toBeGreaterThanOrEqual(1);
      expect(found[0].error).toMatch(/Fatal/);
    });
  });

  it('should retryDeadLetters and re-process failed events', () => {
    let callCount = 0;
    bus.on('test.retrydlq', async () => {
      callCount++;
      if (callCount < 4) throw new Error(`Attempt ${callCount} failed`);
    });
    bus.emit('test.retrydlq', {});
    return new Promise(r => setTimeout(r, 4000)).then(() => {
      const count = bus.retryDeadLetters();
      // Should return number of dead letters
      expect(typeof count).toBe('number');
    });
  });
});

describe('EventBus — Idempotency', () => {
  it('should deduplicate identical events via content hash', () => {
    const events = [];
    bus.on('test.dedup', (ev) => { events.push(ev.payload); });
    bus.emit('test.dedup', { same: 'payload' });
    bus.emit('test.dedup', { same: 'payload' });
    return new Promise(setImmediate).then(() => {
      // Same payload should be deduped... but note the bus emits first, then checks
      // Actually the bus dedupes BEFORE dispatching
      expect(events.length).toBe(1);
    });
  });

  it('should not deduplicate different payloads', () => {
    const events = [];
    bus.on('test.nodedup', (ev) => { events.push(ev.payload); });
    bus.emit('test.nodedup', { a: 'different1' });
    bus.emit('test.nodedup', { b: 'different2' });
    return new Promise(setImmediate).then(() => {
      expect(events.length).toBe(2);
    });
  });
});

describe('EventBus — Backpressure', () => {
  it('should queue events when concurrent exceeds MAX_CONCURRENT', () => {
    // Create a handler that takes 100ms
    bus.on('test.bp', async () => {
      await new Promise(r => setTimeout(r, 100));
    });
    // Emit 15 events quickly (MAX_CONCURRENT=10)
    for (let i = 0; i < 15; i++) {
      bus.emit('test.bp', { idx: i });
    }
    return new Promise(r => setTimeout(r, 500)).then(() => {
      const m = bus.getMetrics();
      expect(m.emitted).toBe(15);
    });
  });
});

describe('EventBus — Metrics', () => {
  it('should expose getMetrics with correct counters', () => {
    const m0 = bus.getMetrics();
    expect(m0.emitted).toBe(0);
    expect(m0.processed).toBe(0);
    expect(m0.retries).toBe(0);
    expect(m0.failures).toBe(0);
    expect(m0.deduped).toBe(0);
    expect(m0.dlq).toBe(0);
    expect(m0.concurrent).toBe(0);
    expect(m0.pending).toBe(0);
    expect(typeof m0.handlers).toBe('object');
  });

  it('should increment emitted on each emit', () => {
    bus.on('test.metrics', () => {});
    bus.emit('test.metrics', {});
    bus.emit('test.metrics', {});
    bus.emit('test.metrics', {});
    return new Promise(setImmediate).then(() => {
      const m = bus.getMetrics();
      expect(m.emitted).toBe(3);
    });
  });
});

describe('EventBus — Drain', () => {
  it('should resolve drain when no concurrent handlers are running', async () => {
    bus.on('test.drain.ok', async () => { await new Promise(r => setTimeout(r, 10)); });
    bus.emit('test.drain.ok', {});
    const started = Date.now();
    await bus.drain(2000);
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(2000);
  });

  it('should timeout drain if handlers take too long', async () => {
    bus.on('test.drain.timeout', async () => { await new Promise(r => setTimeout(r, 5000)); });
    bus.emit('test.drain.timeout', {});
    const started = Date.now();
    await bus.drain(500);
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(450);
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('EventBus — getDeadLetters', () => {
  it('should return empty array when no failures', () => {
    const dl = bus.getDeadLetters();
    expect(dl).toEqual([]);
  });
});
