/**
 * wheel_saver_client.js
 * Cliente Node.js para el API REST de WheelSaver (FastAPI)
 *
 * Permite que LifeOS consulte la base de datos de WheelSaver
 * desde JavaScript, siguiendo el patrón de stores de LifeOS.
 *
 * Uso:
 *   const ws = require('./wheel_saver_client');
 *   const results = await ws.search('orm testing');
 *   const stats = await ws.stats();
 */

const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');

const WHEELSAVER_DIR = path.resolve(__dirname, '..', '..', 'wheel-saver');
const VENV_PYTHON = path.join(WHEELSAVER_DIR, 'venv', 'Scripts', 'python.exe');
const CLI_SCRIPT = path.join(WHEELSAVER_DIR, 'cli.py');

const DEFAULT_API_PORT = 8008;
const API_BASE = `http://127.0.0.1:${DEFAULT_API_PORT}`;

// ── Helper: fetch con timeout ──────────────────────────────────────
async function apiFetch(endpoint, opts = {}) {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout ?? 10_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      ...opts,
    });
    if (!res.ok) {
      throw new Error(`WheelSaver API ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`WheelSaver API timeout tras ${opts.timeout ?? 10_000}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Comprobar si el servidor API está corriendo ────────────────────
async function isRunning() {
  try {
    await apiFetch('/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// ── Lanzar el servidor API (Fondo) ─────────────────────────────────
let serverProcess = null;

/**
 * Inicia el servidor FastAPI de WheelSaver en un proceso hijo.
 * @param {object} opts
 * @param {number} opts.port - Puerto (default: 8008)
 * @param {number} opts.timeout - Tiempo máximo de espera (default: 15000ms)
 * @returns {Promise<boolean>} true si inició correctamente
 */
async function startServer(opts = {}) {
  if (await isRunning()) return true;

  const port = opts.port ?? DEFAULT_API_PORT;
  return new Promise((resolve, reject) => {
    const env = { ...process.env };

    serverProcess = spawn(VENV_PYTHON, [CLI_SCRIPT, 'api', '--port', String(port)], {
      cwd: WHEELSAVER_DIR,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`WheelSaver server no arrancó en ${opts.timeout ?? 15000}ms`));
      }
    }, opts.timeout ?? 15_000);

    const onData = (stream) => (data) => {
      const msg = data.toString();
      if (!resolved && (msg.includes('Uvicorn running on') || msg.includes('Application startup complete'))) {
        resolved = true;
        clearTimeout(timeout);
        // Darle 500ms más para estabilizar
        setTimeout(() => resolve(true), 500);
      }
    };

    serverProcess.stdout.on('data', onData('stdout'));
    serverProcess.stderr.on('data', onData('stderr'));

    serverProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    serverProcess.on('exit', (code) => {
      serverProcess = null;
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`WheelSaver server exited with code ${code}`));
      }
    });
  });
}

/**
 * Detiene el servidor API de WheelSaver.
 */
function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    return true;
  }
  return false;
}

// ── CLI Bridge (fallback cuando no hay API) ────────────────────────
function runCLI(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(VENV_PYTHON, [CLI_SCRIPT, ...args], {
      cwd: WHEELSAVER_DIR,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`WheelSaver CLI timeout: ${args.join(' ')}`));
    }, opts.timeout ?? 60_000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`WheelSaver CLI exit ${code}: ${stderr.slice(0, 500)}`));
      }
    });

    proc.on('error', reject);
  });
}

// ── API de búsqueda ────────────────────────────────────────────────

/**
 * Busca repos en la base de datos de WheelSaver.
 * @param {string} query - Términos de búsqueda
 * @param {object} opts
 * @param {number} opts.limit - Máx resultados (default: 25)
 * @param {string} opts.language - Filtrar por lenguaje
 * @param {number} opts.minStars - Estrellas mínimas
 * @returns {Promise<Array>}
 */
async function search(query, opts = {}) {
  const params = new URLSearchParams({ q: query });
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.language) params.set('language', opts.language);
  if (opts.minStars) params.set('min_stars', opts.minStars);

  try {
    const res = await apiFetch(`/search?${params}`);
    return res.repos ?? res.results ?? res;
  } catch {
    // Fallback a CLI
    const args = ['search', query, '--limit', String(opts.limit ?? 25)];
    if (opts.language) args.push('--language', opts.language);
    if (opts.minStars) args.push('--min-stars', String(opts.minStars));
    const { stdout } = await runCLI(args);
    return { raw: stdout };
  }
}

/**
 * Obtiene estadísticas de la base de datos.
 * @returns {Promise<object>}
 */
async function stats() {
  try {
    return await apiFetch('/stats');
  } catch {
    const { stdout } = await runCLI(['stats']);
    return { raw: stdout };
  }
}

/**
 * Obtiene la distribución de lenguajes.
 * @param {object} opts
 * @param {number} opts.limit - Máx lenguajes (default: 20)
 * @param {number} opts.minRepos - Mín repos por lenguaje
 * @returns {Promise<Array>}
 */
async function languages(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.minRepos) params.set('min_repos', opts.minRepos);

  try {
    const res = await apiFetch(`/languages?${params}`);
    return res.languages ?? [];
  } catch {
    return [];
  }
}

/**
 * Obtiene los repositorios mejor rankeados.
 * @param {number} limit - Máx resultados (default: 10)
 * @param {string} language - Filtrar por lenguaje
 * @returns {Promise<Array>}
 */
async function top(limit = 10, language = null) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (language) params.set('language', language);

  try {
    const res = await apiFetch(`/top?${params}`);
    return res.repos ?? [];
  } catch {
    return [];
  }
}

/**
 * Consulta RAG a la base de datos: usa LLM para responder con contexto de repos.
 * @param {string} question - Pregunta sobre qué librería usar
 * @returns {Promise<object>}
 */
async function ask(question) {
  try {
    const res = await apiFetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      timeout: 60_000,
    });
    return res;
  } catch {
    const { stdout } = await runCLI(['ask', question], { timeout: 120_000 });
    return { raw: stdout };
  }
}

// ── Verificar instalación ──────────────────────────────────────────
function checkInstallation() {
  const fs = require('node:fs');
  const checks = {
    dir: fs.existsSync(WHEELSAVER_DIR),
    venv: fs.existsSync(VENV_PYTHON),
    cli: fs.existsSync(CLI_SCRIPT),
    db: fs.existsSync(path.join(WHEELSAVER_DIR, 'data', 'top_repos.db')),
  };
  checks.ok = Object.values(checks).every(Boolean);
  return checks;
}

// ── EventEmitter para integración con Event Bus ────────────────────
const events = new EventEmitter();
events.setMaxListeners(20);

module.exports = {
  // Gestión del servidor
  isRunning,
  startServer,
  stopServer,

  // API pública
  search,
  stats,
  languages,
  top,
  ask,
  runCLI,

  // Utilidades
  checkInstallation,
  events,

  // Constantes
  WHEELSAVER_DIR,
  DEFAULT_API_PORT,
};
