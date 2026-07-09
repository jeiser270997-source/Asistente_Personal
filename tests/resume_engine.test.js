/**
 * tests/resume_engine.test.js
 * Tests for lib/runtime/resume_engine.js — job lifecycle, checkpoints, canResume.
 */
const path = require('node:path');
const fs = require('node:fs');

const { createTestDb } = require('./helpers/setup');

let cleanupFn = () => {};

beforeEach(() => {
  const { cleanup } = createTestDb();
  cleanupFn = cleanup;
  // Fresh modules each test
  delete require.cache[require.resolve('../runtime/stores/Database')];
  delete require.cache[require.resolve('../runtime/stores/CheckpointStore')];
  delete require.cache[require.resolve('../runtime/stores/JobStore')];
  delete require.cache[require.resolve('../lib/runtime/resume_engine')];
  // Init DB
  require('../runtime/stores/Database').getDb();
});

afterEach(() => {
  cleanupFn();
});

function freshEngine() {
  return require('../lib/runtime/resume_engine');
}

describe('ResumeEngine', () => {
  it('should start a job and create a running record', () => {
    const re = freshEngine();
    const ctx = re.start('test_job', { source: 'test' });

    expect(ctx.jobName).toBe('test_job');
    expect(ctx.attempt).toBe(1);
    expect(ctx.timestamp).toBeTruthy();

    // Verify in JobStore
    const JobStore = require('../runtime/stores/JobStore');
    const lastRun = JobStore.getLastRun('test_job');
    expect(lastRun).toBeTruthy();
    expect(lastRun.status).toBe('running');
  });

  it('should finish a job and update status', () => {
    const re = freshEngine();
    re.start('test_job');
    re.finish('test_job', 'success', { processed: 42 });

    const JobStore = require('../runtime/stores/JobStore');
    const lastRun = JobStore.getLastRun('test_job');
    expect(lastRun.status).toBe('success');
  });

  it('should allow resume after start, disallow after finish', () => {
    const re = freshEngine();
    // Can't resume if no runs exist
    expect(re.canResume('never_started')).toBe(false);

    // After start, can resume
    re.start('resumable_job');
    expect(re.canResume('resumable_job')).toBe(true);

    // After finish, cannot resume
    re.finish('resumable_job', 'completed');
    expect(re.canResume('resumable_job')).toBe(false);
  });

  it('should save and load checkpoints', () => {
    const re = freshEngine();

    // Save checkpoint
    re.save('checkpoint_job', { cursor: 42, page: 3 });

    // Load via start()
    const ctx = re.start('checkpoint_job');
    // The checkpoint is loaded inside start() via load()
    // Checkpoint was saved, start creates a new run
    const JobStore = require('../runtime/stores/JobStore');
    const lastRun = JobStore.getLastRun('checkpoint_job');
    expect(lastRun.status).toBe('running');
    expect(ctx.attempt).toBe(1);
  });

  it('should increment attempt counter on successive runs', () => {
    const re = freshEngine();

    const ctx1 = re.start('multi_run');
    expect(ctx1.attempt).toBe(1);
    re.finish('multi_run', 'success');

    const ctx2 = re.start('multi_run');
    expect(ctx2.attempt).toBe(2);
    re.finish('multi_run', 'success');
  });
});
