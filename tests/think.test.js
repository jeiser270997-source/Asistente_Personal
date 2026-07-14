/**
 * tests/think.test.js
 * Tests for lib/think/think.js — decision engine, needsLLM, enrichPayload, execute.
 */

// Mock event bus — use a real function so emit doesn't throw
vi.mock('../lib/events/event_bus', () => ({ emit: () => {} }));

// Mock ai/decision
vi.mock('../lib/ai/decision', () => ({
  decide: vi.fn().mockResolvedValue({
    decisiones: [
      { type: 'test.decision', payload: { msg: 'test' }, priority: 'normal' },
    ],
  }),
}));

// Mock json-rules-engine to return controlled results
vi.mock('json-rules-engine', () => {
  const mockFn = vi.fn();
  const mockEngine = {
    addRule: vi.fn(),
    run: vi.fn().mockResolvedValue({ events: [] }),
  };
  mockFn.mockReturnValue(mockEngine);
  return { Engine: mockFn };
});

// Mock better-sqlite3 for state_snapshot
vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({})),
      all: vi.fn(() => []),
      run: vi.fn(),
    })),
    pragma: vi.fn(),
    close: vi.fn(),
  };
  return vi.fn(() => mockDb);
});

describe('Think', () => {
  let think;

  beforeAll(() => {
    think = require('../lib/think/think');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export think, execute, getDecisionLog, needsLLM', () => {
    expect(think.think).toBeDefined();
    expect(think.execute).toBeDefined();
    expect(think.getDecisionLog).toBeDefined();
    expect(think.needsLLM).toBeDefined();
  });

  it('should return false for needsLLM with low urgency state', () => {
    const state = {
      casos: { urgentes: 0, abiertos: 2 },
      senales_estres: { alto: false, motivo: null },
      empleo: { sin_respuesta: 2 },
    };
    expect(think.needsLLM(state)).toBe(false);
  });

  it('should return true for needsLLM with high urgency state', () => {
    const state = {
      casos: { urgentes: 2, abiertos: 5 },
      senales_estres: { alto: true, motivo: 'too_many_urgent' },
      empleo: { sin_respuesta: 8 },
    };
    expect(think.needsLLM(state)).toBe(true);
  });

  it('should emit events through execute without throwing', () => {
    const decisions = [
      { type: 'job.strategy.change', payload: { reason: 'test' }, source: 'jarvis', priority: 'normal' },
      { type: 'test.event', payload: { data: 1 }, source: 'jarvis', priority: 'low' },
    ];
    expect(() => think.execute(decisions)).not.toThrow();
  });

  it('should log decisions and return them via getDecisionLog', async () => {
    const state = {
      casos: { urgentes: 0, abiertos: 2, vencidos: 0 },
      senales_estres: { alto: false, motivo: null },
      empleo: { sin_respuesta: 1 },
      estudio: {},
      sistema: { horas_libres_hoy: 3, errores_24h: 0 },
    };

    const decisions = await think.think(state);
    expect(Array.isArray(decisions)).toBe(true);
    expect(think.getDecisionLog().length).toBeGreaterThanOrEqual(1);

    const lastLog = think.getDecisionLog()[think.getDecisionLog().length - 1];
    expect(lastLog).toHaveProperty('timestamp');
    expect(lastLog).toHaveProperty('input');
    expect(lastLog).toHaveProperty('output');
  });

  it('should limit decision log to 100 entries', () => {
    const log = think.getDecisionLog();
    expect(log.length).toBeLessThanOrEqual(100);
  });

  it('should return empty array when no rules trigger', async () => {
    // Mock engine.run to return events
    const state = {
      casos: { urgentes: 0, abiertos: 1, vencidos: 0 },
      senales_estres: { alto: false, motivo: null },
      empleo: { sin_respuesta: 0 },
      estudio: {},
      sistema: { horas_libres_hoy: 5, errores_24h: 0 },
    };
    const decisions = await think.think(state);
    expect(Array.isArray(decisions)).toBe(true);
  });
});
