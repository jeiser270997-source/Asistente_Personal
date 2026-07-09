/**
 * tests/checkpoint_store.test.js
 * Tests for runtime/stores/CheckpointStore.js — CRUD, JSON serialization, JSON fallback.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  // Clear module cache for fresh store each test
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/CheckpointStore')];
  // Ensure DB is initialized
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/CheckpointStore');
}

describe('CheckpointStore', () => {
  it('should store and retrieve a simple value', () => {
    const store = freshStore();
    store.set('test_key', { foo: 'bar' });
    const result = store.get('test_key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should handle complex nested objects', () => {
    const store = freshStore();
    const complex = {
      numbers: [1, 2, 3],
      nested: { a: { b: 'deep' } },
      mixed: [null, true, { x: 1 }],
    };
    store.set('complex', complex);
    const result = store.get('complex');
    expect(result).toEqual(complex);
  });

  it('should return null for non-existent keys', () => {
    const store = freshStore();
    const result = store.get('non_existent_key_xyz');
    expect(result).toBeNull();
  });

  it('should overwrite existing values on set', () => {
    const store = freshStore();
    store.set('updatable', { version: 1 });
    store.set('updatable', { version: 2, extra: true });
    const result = store.get('updatable');
    expect(result).toEqual({ version: 2, extra: true });
  });

  it('should store primitive values', () => {
    const store = freshStore();
    store.set('string_val', 'hello');
    store.set('number_val', 42);
    expect(store.get('string_val')).toBe('hello');
    expect(store.get('number_val')).toBe(42);
  });
});
