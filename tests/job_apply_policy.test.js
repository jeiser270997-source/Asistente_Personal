/**
 * Política semi-auto de Job Hunter — sin red, sin Playwright.
 * Garantiza: default no postula; LIVE solo con --auto.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolveApplyPolicy: resolveJobLoop } = require('../scripts/jobs/job_loop.js');
const { resolveApplyPolicy: resolveApply } = require('../scripts/jobs/computrabajo_apply.js');

describe('job_loop resolveApplyPolicy', () => {
  it('default (sin flags) es SEMI-AUTO / dry-run', () => {
    const p = resolveJobLoop(['node', 'job_loop.js']);
    expect(p.dryRun).toBe(true);
    expect(p.auto).toBe(false);
    expect(p.mode).toBe('SEMI-AUTO');
  });

  it('--dry-run explícito sigue semi-auto', () => {
    const p = resolveJobLoop(['node', 'job_loop.js', '--dry-run']);
    expect(p.dryRun).toBe(true);
    expect(p.mode).toBe('SEMI-AUTO');
  });

  it('--auto habilita LIVE', () => {
    const p = resolveJobLoop(['node', 'job_loop.js', '--auto']);
    expect(p.dryRun).toBe(false);
    expect(p.auto).toBe(true);
    expect(p.mode).toBe('LIVE');
  });

  it('--auto + --dry-run gana dry-run (fail-safe)', () => {
    const p = resolveJobLoop(['node', 'job_loop.js', '--auto', '--dry-run']);
    expect(p.dryRun).toBe(true);
    expect(p.auto).toBe(false);
    expect(p.mode).toBe('SEMI-AUTO');
  });
});

describe('computrabajo_apply resolveApplyPolicy', () => {
  it('default es SEMI-AUTO', () => {
    const p = resolveApply(['node', 'computrabajo_apply.js']);
    expect(p.dryRun).toBe(true);
    expect(p.mode).toBe('SEMI-AUTO');
  });

  it('--auto es LIVE', () => {
    const p = resolveApply(['node', 'computrabajo_apply.js', '--auto']);
    expect(p.dryRun).toBe(false);
    expect(p.mode).toBe('LIVE');
  });

  it('--auto + --dry-run es SEMI-AUTO', () => {
    const p = resolveApply(['node', 'computrabajo_apply.js', '--auto', '--dry-run']);
    expect(p.dryRun).toBe(true);
    expect(p.mode).toBe('SEMI-AUTO');
  });
});
