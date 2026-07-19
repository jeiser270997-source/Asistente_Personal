/**
 * tests/outbox_store.test.js
 * Tests for runtime/stores/OutboxStore.js — insert, getPending, markFailed, resetStuck, DLQ.
 */
const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};
let db;

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/OutboxStore')];
  db = require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/OutboxStore');
}

describe('OutboxStore', () => {
  it('should insert an event and return event_id', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.event', { hello: 'world' });
    expect(id).toMatch(/^evt_/);
  });

  it('should store the event in the database', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.event', { hello: 'world' });

    const rows = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').all(id);
    expect(rows.length).toBe(1);
    expect(rows[0].event_type).toBe('test.event');
    expect(JSON.parse(rows[0].payload)).toEqual({ hello: 'world' });
  });

  it('should return pending events via getPending()', () => {
    const store = freshStore();
    store.insert(db, 'event.a', { data: 'a' });
    store.insert(db, 'event.b', { data: 'b' });

    const pending = store.getPending(db);
    expect(pending.length).toBe(2);
    const types = pending.map(e => e.eventType);
    expect(types).toContain('event.a');
    expect(types).toContain('event.b');
    expect(pending.every(e => e.status === 'pending')).toBe(true);
  });

  it('should order pending events by created_at ASC', () => {
    const store = freshStore();
    store.insert(db, 'event.1', {});
    store.insert(db, 'event.2', {});
    store.insert(db, 'event.3', {});

    const pending = store.getPending(db, 10);
    expect(pending.length).toBe(3);
    for (let i = 1; i < pending.length; i++) {
      expect(new Date(pending[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(pending[i - 1].createdAt).getTime()
      );
    }
  });

  it('should mark event as processing', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.process', {});
    store.markProcessing(db, id);

    const row = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').get(id);
    expect(row.status).toBe('processing');
    expect(row.processing_at).toBeTruthy();
  });

  it('should mark event as completed', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.done', {});

    store.markProcessing(db, id);
    store.markCompleted(db, id);

    const row = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').get(id);
    expect(row.status).toBe('completed');
  });

  it('should not return completed events in getPending', () => {
    const store = freshStore();
    const id1 = store.insert(db, 'event.pending', {});
    const id2 = store.insert(db, 'event.done', {});

    store.markProcessing(db, id2);
    store.markCompleted(db, id2);

    const pending = store.getPending(db);
    const ids = pending.map(e => e.eventId);
    expect(ids).toContain(id1);
    expect(ids).not.toContain(id2);
  });

  it('should increment retry_count on markFailed and reset to pending when under max_retries', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.fail', {});

    // Fail once → should go back to pending
    const wentToDlq = store.markFailed(db, id, 'Error temporal');
    expect(wentToDlq).toBe(false);

    const row1 = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').get(id);
    expect(row1.retry_count).toBe(1);
    expect(row1.status).toBe('pending');
    expect(row1.error).toMatch(/Error temporal/);
  });

  it('should move to failed status after exceeding max_retries', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.fatal', {});

    // Fail 3 times (default max_retries is 3)
    store.markFailed(db, id, 'Error 1');
    store.markFailed(db, id, 'Error 2');
    const wentToDlq = store.markFailed(db, id, 'Error 3');

    expect(wentToDlq).toBe(true);

    const row = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').get(id);
    expect(row.status).toBe('failed');
    expect(row.retry_count).toBe(3);
  });

  it('should reset stuck processing events via resetStuck', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.stuck', {});

    // Manually set to 'processing' with old processing_at
    db.prepare(`
      UPDATE event_outbox SET status = 'processing', processing_at = datetime('now', '-30 minutes')
      WHERE event_id = ?
    `).run(id);

    const resetCount = store.resetStuck(db);
    expect(resetCount).toBe(1);

    const row = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').get(id);
    expect(row.status).toBe('pending');
    expect(row.retry_count).toBe(0);
  });

  it('should not reset recent processing events', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.recent', {});

    store.markProcessing(db, id);

    const resetCount = store.resetStuck(db);
    expect(resetCount).toBe(0);
  });

  it('should move failed events to DLQ via moveToDlq', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.dlq', { info: 'goes to dlq' });

    // Make it fail first
    store.markFailed(db, id, 'Final error');
    store.markFailed(db, id, 'Final error');
    store.markFailed(db, id, 'Final error');

    const moved = store.moveToDlq(db, id);
    expect(moved).toBe(true);

    // Check it's in event_dlq
    const dlqRow = db.prepare('SELECT * FROM event_dlq WHERE id = ?').get(id);
    expect(dlqRow).toBeTruthy();
    expect(dlqRow.event_type).toBe('test.dlq');
    expect(dlqRow.status).toBe('pending');
  });

  it('should clean completed events older than N hours', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.old', {});

    // Manually set to 'completed' with old created_at
    db.prepare(`
      UPDATE event_outbox SET status = 'completed', created_at = datetime('now', '-100 hours')
      WHERE event_id = ?
    `).run(id);

    const cleaned = store.cleanCompleted(db, 48);
    expect(cleaned).toBe(1);

    const row = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').get(id);
    expect(row).toBeUndefined();
  });

  it('should not clean recent completed events', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.recent', {});

    store.markProcessing(db, id);
    store.markCompleted(db, id);

    const cleaned = store.cleanCompleted(db, 48);
    expect(cleaned).toBe(0);
  });

  it('should handle store with meta information', () => {
    const store = freshStore();
    const id = store.insert(db, 'test.meta', { key: 'val' }, { source: 'test-suite', priority: 'high' });

    const rows = db.prepare('SELECT * FROM event_outbox WHERE event_id = ?').all(id);
    expect(rows.length).toBe(1);
    const meta = JSON.parse(rows[0].meta);
    expect(meta.source).toBe('test-suite');
    expect(meta.priority).toBe('high');
  });
});
