/**
 * tests/ledger_store.test.js
 * Tests for runtime/stores/LedgerStore.js — emit, getAll, getByTipo, seed from JSON.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/LedgerStore')];
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/LedgerStore');
}

describe('LedgerStore', () => {
  it('should emit and retrieve events via getAll()', () => {
    const store = freshStore();
    store.emit('test_event', { hello: 'world' });

    const all = store.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);

    const found = all.find(e => e.tipo === 'test_event');
    expect(found).toBeTruthy();
    expect(found.hello).toBe('world');
  });

  it('should filter events by tipo via getByTipo()', () => {
    const store = freshStore();
    store.emit('type_a', { data: 'aaa' });
    store.emit('type_b', { data: 'bbb' });
    store.emit('type_a', { data: 'aaa2' });

    const aEvents = store.getByTipo('type_a');
    expect(aEvents.length).toBe(2);
    aEvents.forEach(e => expect(e.tipo).toBe('type_a'));

    const bEvents = store.getByTipo('type_b');
    expect(bEvents.length).toBe(1);
    expect(bEvents[0].data).toBe('bbb');
  });

  it('should return events with id and parsed data', () => {
    const store = freshStore();
    store.emit('test', { value: 42 });

    const all = store.getAll();
    const event = all.find(e => e.tipo === 'test');
    expect(event).toBeTruthy();
    expect(event.id).toBeTruthy();
    expect(typeof event.id).toBe('string');
    expect(event.id).toMatch(/^ledger_/);
    expect(event.value).toBe(42);
  });

  it('should not throw on SQL injection attempts in getByTipo', () => {
    const store = freshStore();
    expect(() => {
      store.getByTipo("'; DROP TABLE ledger; --");
    }).not.toThrow();
    // Ledger table should still exist
    const db = require('../runtime/stores/Database').getDb();
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ledger'"
    ).get();
    expect(tableExists).toBeTruthy();
  });
});
