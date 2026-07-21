#!/usr/bin/env node
/**
 * scripts/diagnostics/pm2_health_monitor.js
 *
 * Monitor de salud para procesos PM2 de LifeOS.
 * Funcionalidades:
 *   1. Verifica que todos los procesos PM2 estén corriendo
 *   2. Reporta estado vía stdout (para logs/healthcheck)
 *   3. Expone un endpoint HTTP para uptime-kuma
 *   4. Envía notificación si algún proceso crítico está caído
 *
 * Uso:
 *   node scripts/diagnostics/pm2_health_monitor.js            # Una ejecución
 *   node scripts/diagnostics/pm2_health_monitor.js --serve    # Modo servidor HTTP
 *
 * Integración con PM2:
 *   pm2 start scripts/diagnostics/pm2_health_monitor.js --name pm2-health
 *
 * Integración con uptime-kuma:
 *   Agregar monitor HTTP → http://localhost:9090/health
 */

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const HEALTH_PORT = 9090;
const CHECK_INTERVAL_MS = 60_000;

// Procesos cuyo fallo es crítico (notificar inmediatamente)
const CRITICAL_PROCESSES = [];

// Todos los procesos esperados
const EXPECTED_PROCESSES = [
  'brain-orchestrator',
  'context-engine-daily',
  'morning-briefing',
  'email-cleaner',
  'inbox-sensor',
  'sena-scraper',
  'sena-tracker',
  'simit-checker',
  'dian-scraper',
  'computrabajo-scraper',
  'computrabajo-apply',
  'job-loop',
  'healthcheck',
  'recordatorio-deepseek',
  'document-pipeline',
  'vehicle-manager',
  'backup-dbs',
];

/**
 * Obtiene el estado de PM2 via CLI (fallback a `pm2 jlist`).
 * @returns {Array} Lista de procesos con { name, status, pid, cpu, memory, uptime }
 */
function getPM2Status() {
  try {
    const raw = execSync('pm2 jlist --silent', {
      encoding: 'utf-8',
      timeout: 10_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const processes = JSON.parse(raw);
    return processes.map(p => ({
      name: p.name,
      status: p.pm2_env?.status || 'unknown',
      pid: p.pid,
      cpu: p.monit?.cpu ?? null,
      memory: p.monit?.memory ?? null,
      uptime: p.pm2_env?.pm_uptime ?? null,
      restart_count: p.pm2_env?.restart_time ?? 0,
      unstable_restarts: p.pm2_env?.unstable_restarts ?? 0,
    }));
  } catch (e) {
    console.error(`[PM2Monitor] Error obteniendo PM2 status: ${e.message}`);
    return [];
  }
}

/**
 * Construye el reporte de salud completo.
 * @returns {object} Reporte con status, procesos, resumen
 */
function buildHealthReport() {
  const processes = getPM2Status();
  const running = {};
  for (const p of processes) {
    running[p.name] = p;
  }

  const results = [];
  for (const name of EXPECTED_PROCESSES) {
    const proc = running[name];
    if (!proc) {
      results.push({ name, status: 'not_found', pid: null, cpu: null, memory: null, uptime: null, restart_count: 0 });
    } else {
      results.push({
        name: proc.name,
        status: proc.status === 'online' ? 'running' : proc.status,
        pid: proc.pid,
        cpu: proc.cpu,
        memory: proc.memory,
        uptime: proc.uptime,
        restart_count: proc.restart_count,
      });
    }
  }

  const runningCount = results.filter(r => r.status === 'running').length;
  const totalCount = EXPECTED_PROCESSES.length;
  const failed = results.filter(r => r.status !== 'running');
  const criticalDown = failed.filter(r => CRITICAL_PROCESSES.includes(r.name));
  const score = totalCount > 0 ? Math.round((runningCount / totalCount) * 100) : 0;

  return {
    timestamp: new Date().toISOString(),
    score,
    summary: `${runningCount}/${totalCount} procesos corriendo`,
    processes: results,
    critical_down: criticalDown.map(r => r.name),
    total: totalCount,
    running: runningCount,
    failed: failed.length,
  };
}

/**
 * Envía notificación si hay procesos críticos caídos.
 */
async function notifyIfCritical(report) {
  if (report.critical_down.length === 0) return;

  try {
    const { sendNotification } = require(path.resolve(__dirname, '..', '..', 'lib', 'integrations', 'notifications'));
    const message = `PROCESOS CRITICOS CAIDOS:\n${report.critical_down.map(n => `  - ${n}`).join('\n')}\n\nScore: ${report.score}%\nTotal: ${report.running}/${report.total} procesos\nTimestamp: ${report.timestamp}`;
    await sendNotification('PM2 Health Alert', message, 'critical');
  } catch (e) {
    console.error(`[PM2Monitor] Error enviando notificacion: ${e.message}`);
  }
}

// ── Modo servidor HTTP ────────────────────────────────────────────

function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/health' || url.pathname === '/') {
      const report = buildHealthReport();
      const statusCode = report.score >= 90 ? 200 : report.score >= 70 ? 200 : 503;

      res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(report, null, 2));
      return;
    }

    if (url.pathname === '/metrics') {
      const report = buildHealthReport();
      // Prometheus-style metrics
      const metrics = [
        `# HELP pm2_health_score Health score for PM2 processes (0-100)`,
        `# TYPE pm2_health_score gauge`,
        `pm2_health_score ${report.score}`,
        ``,
        `# HELP pm2_process_running Whether a PM2 process is running (1=yes, 0=no)`,
        `# TYPE pm2_process_running gauge`,
        ...report.processes.map(p =>
          `pm2_process_running{name="${p.name}",status="${p.status}"} ${p.status === 'running' ? 1 : 0}`
        ),
        ``,
        `# HELP pm2_process_restarts Number of restarts per process`,
        `# TYPE pm2_process_restarts gauge`,
        ...report.processes.map(p =>
          `pm2_process_restarts{name="${p.name}"} ${p.restart_count || 0}`
        ),
      ].join('\n');

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(metrics);
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use /health or /metrics' }));
  });

  server.listen(HEALTH_PORT, () => {
    console.log(`[PM2Monitor] Servidor health corriendo en http://localhost:${HEALTH_PORT}`);
    console.log(`[PM2Monitor] Endpoints: /health (JSON), /metrics (Prometheus)`);
  });

  // Health check periódico + notificación
  setInterval(async () => {
    const report = buildHealthReport();
    console.log(`[PM2Monitor] Health: ${report.running}/${report.total} (${report.score}%)`);      const stateFile = path.join(__dirname, '..', '..', 'data', 'state', 'audit', 'pm2_health.json');
    const fs = require('node:fs');
    const dir = require('node:path').dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(report, null, 2));
    await notifyIfCritical(report);
  }, CHECK_INTERVAL_MS);

  return server;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--serve')) {
    startServer();
    console.log(`[PM2Monitor] ✅ Monitoreando ${EXPECTED_PROCESSES.length} procesos PM2...`);
    return;
  }

  // Una sola ejecución
  const report = buildHealthReport();
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nHealth Score: ${report.score}% — ${report.summary}`);

  if (report.critical_down.length > 0) {
    console.error(`\n⚠️  CRÍTICOS CAÍDOS: ${report.critical_down.join(', ')}`);
    await notifyIfCritical(report);
    process.exit(report.score >= 70 ? 0 : 1);
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[PM2Monitor] Error fatal: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { getPM2Status, buildHealthReport };
