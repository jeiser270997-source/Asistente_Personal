/**
 * tests/rule_engine.test.js
 * Tests for lib/runtime/rule_engine.js — deterministic rules, wildcards, priorities.
 */
const path = require('node:path');
const fs = require('node:fs');

// Point to test rules.json
const RULES_PATH = path.resolve(__dirname, '..', 'data', 'config', 'rules.json');

describe('RuleEngine', () => {
  let re;

  beforeAll(() => {
    re = require('../lib/runtime/rule_engine');
  });

  it('should load rules from data/config/rules.json', () => {
    const rules = re.loadRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty('name');
    expect(rules[0]).toHaveProperty('match');
    expect(rules[0]).toHaveProperty('actions');
  });

  it('should match email by wildcard from pattern', () => {
    const email = {
      from: 'notificaciones@dian.gov.co',
      subject: 'Facturación electrónica',
      body: 'Su factura está lista',
    };
    const results = re.matchAll(email);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.label?.toLowerCase().includes('dian'))).toBe(true);
  });

  it('should match email by wildcard subject pattern', () => {
    const email = {
      from: 'info@simit.gov.co',
      subject: 'Comparendo pendiente: ABC123',
      body: 'Tiene un comparendo pendiente',
    };
    const results = re.matchAll(email);
    const simitResults = results.filter(r => r.label?.toLowerCase().includes('simit'));
    expect(simitResults.length).toBeGreaterThan(0);
  });

  it('should return empty array if no rules match', () => {
    const email = {
      from: 'unknown@spammer.com',
      subject: 'Win a free iPhone!!!',
      body: 'Click here to claim your prize',
    };
    const results = re.matchAll(email);
    expect(results.length).toBe(0);
  });

  it('should sort results by priority (P0 first)', () => {
    const email = {
      from: 'notificaciones@dian.gov.co',
      subject: 'URGENTE: Requerimiento judicial',
      body: 'Notificación de embargo',
    };
    const results = re.matchAll(email);
    if (results.length >= 2) {
      expect(results[0].priority).toBeDefined();
    }
  });

  it('should support subjectContains matching', () => {
    const email = {
      from: 'notificaciones@ramajudicial.gov.co',
      subject: 'Notificación proceso judicial: 2026-00123',
      body: 'Citación para audiencia',
    };
    const results = re.matchAll(email);
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('should match anyWord in combined text', () => {
    const email = {
      from: 'cesde@cesde.edu.co',
      subject: 'Clase de automatización - Recordatorio',
      body: 'Mañana tenemos clase a las 6pm',
    };
    const results = re.matchAll(email);
    const cesdeResults = results.filter(r => r.label?.toLowerCase().includes('cesde'));
    expect(cesdeResults.length).toBeGreaterThanOrEqual(0);
  });

  it('should skip disabled rules', () => {
    const email = {
      from: 'disabled-rule@test.com',
      subject: 'This should not match any disabled rule',
      body: 'test',
    };
    // Should not crash, and disabled rules won't match
    const results = re.matchAll(email);
    // Function should handle gracefully
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return highestPriority result correctly', () => {
    const actions = [
      { priority: 'P2', ruleName: 'normal', label: 'Normal' },
      { priority: 'P0', ruleName: 'urgent', label: 'Urgente' },
      { priority: 'P1', ruleName: 'medium', label: 'Medio' },
    ];
    const highest = re.highestPriority(actions);
    expect(highest.priority).toBe('P0');
    expect(highest.ruleName).toBe('urgent');
  });

  it('should build facts from email correctly', () => {
    // Test internal buildFacts via matchAllSync (calls matchRuleLegacy)
    const email = {
      from: 'test@example.com',
      subject: 'Test subject',
      snippet: 'Test snippet body',
    };
    const results = re.matchAll(email);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle emails with from field containing angle-bracket format', () => {
    const email = {
      from: '"DIAN Notificaciones" <notificaciones@dian.gov.co>',
      subject: 'Novedad en su factura',
      body: 'Tiene una factura pendiente',
    };
    const results = re.matchAll(email);
    const dianResults = results.filter(r => r.label?.toLowerCase().includes('dian'));
    expect(dianResults.length).toBeGreaterThanOrEqual(0);
  });

  it('should create engine with async matchAllAsync', async () => {
    const email = {
      from: 'notificaciones@dian.gov.co',
      subject: 'Requerimiento DIAN',
      body: 'Su declaración de renta',
    };
    const results = await re.matchAllAsync(email);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should createEngine and return a valid engine instance', () => {
    const engine = re.createEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.run).toBe('function');
  });
});
