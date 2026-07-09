/**
 * tests/case_store.test.js
 * Tests for runtime/stores/CaseStore.js — CRUD, timeline, queries.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/CaseStore')];
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshStore() {
  return require('../runtime/stores/CaseStore');
}

describe('CaseStore', () => {
  it('should create and retrieve a case', () => {
    const store = freshStore();
    const id = store.create({
      tipo: 'test',
      titulo: 'Caso de prueba',
      descripcion: 'Descripción test',
      prioridad: 1,
      data: { meta: 'info' },
    });

    const c = store.getById(id);
    expect(c).toBeTruthy();
    expect(c.tipo).toBe('test');
    expect(c.titulo).toBe('Caso de prueba');
    expect(c.descripcion).toBe('Descripción test');
    expect(c.prioridad).toBe(1);
    expect(c.data).toEqual({ meta: 'info' });
    expect(c.estado).toBe('abierto');
  });

  it('should update case fields', () => {
    const store = freshStore();
    const id = store.create({ tipo: 'test', titulo: 'Original' });

    store.update(id, { titulo: 'Actualizado', prioridad: 0 });
    const c = store.getById(id);
    expect(c.titulo).toBe('Actualizado');
    expect(c.prioridad).toBe(0);
  });

  it('should close a case', () => {
    const store = freshStore();
    const id = store.create({ tipo: 'test', titulo: 'Para cerrar' });

    store.close(id);
    const c = store.getById(id);
    expect(c.estado).toBe('cerrado');
    expect(c.fecha_cierre).toBeTruthy();
  });

  it('should add and retrieve timeline events', () => {
    const store = freshStore();
    const caseId = store.create({ tipo: 'timeline_test', titulo: 'Timeline test' });

    store.addEvent(caseId, 'nota', 'Primer evento', { detalle: 'info' });
    store.addEvent(caseId, 'llamada', 'Segundo evento');

    const events = store.getEvents(caseId);
    expect(events.length).toBe(2);
    const tipos = events.map(e => e.tipo);
    expect(tipos).toContain('nota');
    expect(tipos).toContain('llamada');
  });

  it('should not include closed cases in abiertos()', () => {
    const store = freshStore();
    const id1 = store.create({ id: 'abierto_1', tipo: 'test', titulo: 'Abierto' });
    const id2 = store.create({ id: 'cerrado_1', tipo: 'test', titulo: 'Cerrado' });
    store.close(id2);

    const abiertos = store.abiertos();
    const titulos = abiertos.map(c => c.titulo);
    expect(titulos).toContain('Abierto');
    expect(titulos).not.toContain('Cerrado');
  });

  it('should group cases by tipo and estado via porTipo()', () => {
    const store = freshStore();
    store.create({ id: 'legal_1', tipo: 'legal', titulo: 'Caso 1', estado: 'abierto' });
    store.create({ id: 'legal_2', tipo: 'legal', titulo: 'Caso 2', estado: 'abierto' });
    store.create({ id: 'estudio_1', tipo: 'estudio', titulo: 'Curso A', estado: 'abierto' });

    const grouped = store.porTipo();
    expect(grouped.legal?.abierto).toBe(2);
    expect(grouped.estudio?.abierto).toBe(1);
  });
});
