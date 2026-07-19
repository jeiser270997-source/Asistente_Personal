#!/usr/bin/env node
/**
 * scripts/jarvis_loop.js
 *
 * El latido de Jarvis.
 *
 * Cada N minutos:
 *   1. Toma un snapshot del estado del sistema
 *   2. Piensa (reglas + LLM si aplica)
 *   3. Ejecuta las decisiones (emite eventos)
 *   4. Duerme
 *
 * Uso:
 *   node scripts/jarvis_loop.js                # cada 5 min
 *   node scripts/jarvis_loop.js --interval=10   # cada 10 min
 *   node scripts/jarvis_loop.js --once          # una sola iteracion
 *   node scripts/jarvis_loop.js --chaos         # con chaos testing
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

if (!USE_SQLITE) {
  console.error('[jarvis] Requires STORAGE_DRIVER=sqlite');
  process.exit(1);
}

const { getState } = require('../../lib/context/state_snapshot');
const { think, execute, getDecisionLog, needsLLM } = require('../../lib/think/think');
const bus = require('../../lib/events/event_bus');
require('../../lib/events/event_registry');

const INTERVAL_MIN = parseInt(process.argv.find(a => a.startsWith('--interval='))?.split('=')[1] || '5', 10);
const ONCE = process.argv.includes('--once');

function log(msg) {
  const line = `[jarvis] ${new Date().toISOString()} ${msg}`;
  console.log(line);
}

async function cycle() {
  log('=== Thinking cycle ===');

  // 1. Tomar snapshot
  const state = getState();
  log(`State: ${state.casos.abiertos} casos, ${state.empleo.aplicadas} aplicadas, estres: ${state.senales_estres.alto ? 'ALTO' : 'normal'}`);

  // 2. Pensar
  const decisions = await think(state);
  log(`Decisions: ${decisions.length} (${needsLLM(state) ? 'con LLM' : 'solo reglas'})`);

  if (decisions.length > 0) {
    // 3. Ejecutar
    execute(decisions);
    decisions.forEach(d => log(`  -> ${d.type}: ${d.razon || d.source || ''}`));
    bus.emit('jarvis.cycle', {
      decisions: decisions.length,
      llm: needsLLM(state),
      resumen: decisions.map(d => d.type).join(', '),
    }, { source: 'jarvis', priority: 'normal' });
  }

  log('=== Cycle complete ===');
}

async function main() {
  log(`Jarvis loop started (interval: ${INTERVAL_MIN}min, once: ${ONCE})`);

  if (ONCE) {
    await cycle();
    log('Done (--once)');
    return;
  }

  // Infinite loop
  while (true) {
    const start = Date.now();
    try {
      await cycle();
    } catch (e) {
      log(`Error in cycle: ${e.message}`);
      bus.emit('system.error', { source: 'jarvis_loop', error: e.message }, { source: 'jarvis', priority: 'high' });
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    const sleepMs = Math.max(1000, INTERVAL_MIN * 60 * 1000 - elapsed * 1000);
    log(`Sleeping ${Math.round(sleepMs / 1000)}s...`);
    await new Promise(r => setTimeout(r, sleepMs));
  }
}

main().catch(async (e) => {
  console.error(`[jarvis] Fatal: ${e.message}`);
  await bus.drain();
  process.exit(1);
});
