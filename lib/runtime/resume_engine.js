const path = require('node:path');
const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
let JobStore = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
  JobStore = require('../../runtime/stores/JobStore');
}

// ── Domain objects ──

function ResumeContext(jobName, checkpoint, attempt, metadata) {
  this.jobName = jobName;
  this.checkpoint = checkpoint || {};
  this.attempt = attempt || 1;
  this.timestamp = new Date().toISOString();
  this.metadata = metadata || {};
}

// ── JSON fallback paths (for STORAGE_DRIVER=json) ──

const BASE_DIR = path.resolve(__dirname, '..');
const CHECKPOINT_DIR = path.join(BASE_DIR, 'data');

function jsonPath(key) {
  return path.join(CHECKPOINT_DIR, 'checkpoints', key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json');
}

function readJson(key) {
  try { return JSON.parse(require('fs').readFileSync(jsonPath(key), 'utf8')); }
  catch { return null; }
}

function writeJson(key, data) {
  const dir = path.dirname(jsonPath(key));
  if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true });
  require('fs').writeFileSync(jsonPath(key), JSON.stringify(data, null, 2), 'utf8');
}

// ── Public API ──

function load(jobName) {
  const cp = USE_SQLITE ? CheckpointStore.get(jobName) : readJson(jobName);
  const lastRun = USE_SQLITE ? JobStore.getLastRun(jobName) : null;
  const attempt = lastRun ? lastRun.id + 1 : 1;
  return new ResumeContext(jobName, cp, attempt, { lastRun });
}

function save(jobName, data) {
  if (USE_SQLITE) {
    CheckpointStore.set(jobName, data);
  } else {
    writeJson(jobName, data);
  }
}

function start(jobName, metadata) {
  const ctx = load(jobName);
  if (USE_SQLITE) {
    JobStore.startRun(jobName, { attempt: ctx.attempt, ...metadata });
  }
  return ctx;
}

function finish(jobName, status, details) {
  if (USE_SQLITE) {
    JobStore.finishRun(jobName, status || 'completed', details);
  }
}

function canResume(jobName) {
  if (!USE_SQLITE) return false;
  const lastRun = JobStore.getLastRun(jobName);
  if (!lastRun) return false;
  return lastRun.status === 'running' || lastRun.status === 'failed' || lastRun.status === 'error';
}

module.exports = { ResumeContext, load, save, start, finish, canResume };
