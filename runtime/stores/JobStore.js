const path = require('node:path');
const fs = require('node:fs');
const { getDb } = require('./Database');

const JSON_DIR = path.resolve(__dirname, '..', '..', 'data', 'sena');
const JSON_PATH = path.join(JSON_DIR, 'historial_ejecuciones.json');

function loadJson() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch { return []; }
}

function seedFromJson() {
  const db = getDb();
  const items = loadJson();
  if (!items.length) return 0;
  const insert = db.prepare("INSERT OR IGNORE INTO job_runs (job_name, status, duration_ms, details, started_at, finished_at) VALUES (?, ?, ?, ?, ?, ?)");
  const tx = db.transaction(() => {
    for (const item of items) {
      const name = item.name || item.job_name || item.job || 'unknown';
      insert.run(name, item.status || 'success', item.duration_ms || null,
        item.details ? JSON.stringify(item.details) : null,
        item.started_at || item.started || null,
        item.finished_at || item.finished || null);
    }
  });
  tx();
  return items.length;
}

const _seededJobs = { runs: false };

function getAll(jobName) {
  const db = getDb();
  let rows;
  if (jobName) {
    rows = db.prepare("SELECT * FROM job_runs WHERE job_name = ? ORDER BY started_at DESC").all(jobName);
  } else {
    rows = db.prepare("SELECT * FROM job_runs ORDER BY started_at DESC").all();
  }
  if (!rows.length && !_seededJobs.runs) {
    _seededJobs.runs = true;
    seedFromJson();
    return getAll(jobName);
  }
  return rows.map(r => ({
    id: r.id, job_name: r.job_name, status: r.status,
    duration_ms: r.duration_ms,
    details: r.details ? JSON.parse(r.details) : null,
    started_at: r.started_at, finished_at: r.finished_at,
  }));
}

function getLastRun(jobName) {
  const row = getDb().prepare("SELECT * FROM job_runs WHERE job_name = ? ORDER BY started_at DESC LIMIT 1").get(jobName);
  if (!row) return null;
  return { id: row.id, job_name: row.job_name, status: row.status, duration_ms: row.duration_ms, started_at: row.started_at, finished_at: row.finished_at };
}

function logRun(jobName, status, durationMs, details) {
  getDb().prepare("INSERT INTO job_runs (job_name, status, duration_ms, details, finished_at) VALUES (?, ?, ?, ?, datetime('now'))").run(
    jobName, status, durationMs || null, details ? JSON.stringify(details) : null
  );
}

function startRun(jobName, details) {
  getDb().prepare("INSERT INTO job_runs (job_name, status, details) VALUES (?, 'running', ?)").run(
    jobName, details ? JSON.stringify(details) : null
  );
}

function finishRun(jobName, status, details) {
  const row = getDb().prepare("SELECT id FROM job_runs WHERE job_name = ? AND status = 'running' AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1").get(jobName);
  if (row) {
    getDb().prepare("UPDATE job_runs SET status = ?, details = ?, finished_at = datetime('now') WHERE id = ?").run(
      status || 'completed', details ? JSON.stringify(details) : null, row.id
    );
  } else {
    logRun(jobName, status || 'completed', null, details);
  }
}

module.exports = { getAll, getLastRun, logRun, startRun, finishRun, seedFromJson };
