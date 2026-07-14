const CheckpointStore = require('../../runtime/stores/CheckpointStore');
const JobStore = require('../../runtime/stores/JobStore');

// ── Domain objects ──

function ResumeContext(jobName, checkpoint, attempt, metadata) {
  this.jobName = jobName;
  this.checkpoint = checkpoint || {};
  this.attempt = attempt || 1;
  this.timestamp = new Date().toISOString();
  this.metadata = metadata || {};
}

// ── Public API ──

function load(jobName) {
  const cp = CheckpointStore.get(jobName);
  const lastRun = JobStore.getLastRun(jobName);
  const attempt = lastRun ? lastRun.id + 1 : 1;
  return new ResumeContext(jobName, cp, attempt, { lastRun });
}

function save(jobName, data) {
  CheckpointStore.set(jobName, data);
}

function start(jobName, metadata) {
  const ctx = load(jobName);
  JobStore.startRun(jobName, { attempt: ctx.attempt, ...metadata });
  return ctx;
}

function finish(jobName, status, details) {
  JobStore.finishRun(jobName, status || 'completed', details);
}

function canResume(jobName) {
  const lastRun = JobStore.getLastRun(jobName);
  if (!lastRun) return false;
  return lastRun.status === 'running' || lastRun.status === 'failed' || lastRun.status === 'error';
}

module.exports = { ResumeContext, load, save, start, finish, canResume };
