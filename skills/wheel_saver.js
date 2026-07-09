/**
 * wheel_saver.js — Skill de LifeOS para WheelSaver
 *
 * Se conecta al Event Bus de LifeOS para:
 *  - Escuchar peticiones de búsqueda de repos (wheel_saver.search)
 *  - Escuchar peticiones de estadísticas (wheel_saver.stats)
 *  - Ejecutar el servidor API automáticamente cuando sea necesario
 *
 * Registro: importar en lib/events/event_registry.js
 */

const path = require('node:path');

let ws = null;
let serverAutoStarted = false;

function getClient() {
  if (!ws) {
    ws = require('../lib/integrations/wheel_saver_client');
  }
  return ws;
}

/**
 * Arranca el servidor API si no está corriendo (auto-start una sola vez).
 */
async function ensureServer() {
  if (serverAutoStarted) return true;
  const client = getClient();
  const running = await client.isRunning();
  if (!running) {
    try {
      await client.startServer({ timeout: 15_000 });
      serverAutoStarted = true;
      console.log('[wheel-saver] 🚀 Servidor API iniciado automáticamente');
    } catch (err) {
      console.warn('[wheel-saver] ⚠ No se pudo iniciar servidor API, usando CLI:', err.message);
      return false;
    }
  } else {
    serverAutoStarted = true;
  }
  return true;
}

// ── Definición del skill ──────────────────────────────────────────

module.exports = {
  name: 'wheel_saver',
  description: 'Busca librerías y herramientas en la base de datos local de GitHub (WheelSaver)',
  trigger: 'wheel_saver.*',  // Escucha todos los eventos wheel_saver.*

  input: {
    action: { type: 'string', required: true, description: 'search | stats | top | ask | health' },
    query: { type: 'string', description: 'Términos de búsqueda o pregunta' },
    options: { type: 'object', description: 'Opciones adicionales (language, limit, minStars)' },
  },

  /**
   * Ejecuta una acción de WheelSaver.
   * @param {object} ctx - Contexto del Event Bus
   * @param {object} ctx.payload - { action, query, options }
   */
  async run(ctx) {
    const { action, query, options = {} } = ctx.payload;
    const client = getClient();

    // Auto-arrancar server para acciones que lo necesitan
    if (['search', 'stats', 'top', 'languages'].includes(action)) {
      await ensureServer();
    }

    switch (action) {
      case 'search': {
        if (!query) throw new Error('Se requiere query para search');
        const results = await client.search(query, options);
        return {
          action: 'search',
          query,
          results: Array.isArray(results) ? results.slice(0, options.limit ?? 15) : results,
        };
      }

      case 'stats': {
        const s = await client.stats();
        return { action: 'stats', stats: s };
      }

      case 'top': {
        const limit = options.limit ?? 10;
        const language = options.language ?? null;
        const results = await client.top(limit, language);
        return { action: 'top', results };
      }

      case 'languages': {
        const limit = options.limit ?? 20;
        const results = await client.languages({ limit });
        return { action: 'languages', results };
      }

      case 'ask': {
        if (!query) throw new Error('Se requiere query para ask');
        const result = await client.ask(query);
        return { action: 'ask', question: query, result };
      }

      case 'health': {
        const running = await client.isRunning();
        const inst = client.checkInstallation();
        return { action: 'health', serverRunning: running, installation: inst };
      }

      case 'install-check': {
        return { action: 'install-check', ...client.checkInstallation() };
      }

      default:
        throw new Error(`Acción desconocida: ${action}. Usa: search, stats, top, languages, ask, health`);
    }
  },
};
