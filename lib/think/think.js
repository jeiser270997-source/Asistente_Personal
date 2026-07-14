/**
 * lib/think.js — El cerebro de Jarvis
 *
 * Toma un StateSnapshot y devuelve decisiones.
 * Empieza con reglas, escala a LLM cuando necesita
 * razonamiento complejo.
 *
 * Cada decisión es un evento que se emite al Event Bus.
 */

const fs = require('fs');
const path = require('path');
const { Engine } = require('json-rules-engine');
const { getState } = require('../context/state_snapshot');
const { getActive } = require('../../runtime/goals');
const bus = require('../events/event_bus');
const { decide } = require('../ai/decision');

// ── Decision Store ──

const decisionLog = [];

function logDecision(input, output) {
  decisionLog.push({
    timestamp: new Date().toISOString(),
    input: { casos_abiertos: input.casos.abiertos, empleo: input.empleo, estres: input.senales_estres },
    output,
  });
  // Keep last 100
  if (decisionLog.length > 100) decisionLog.splice(0, decisionLog.length - 100);
}

function getDecisionLog() {
  return [...decisionLog];
}

// ── Policy Thresholds (cargadas desde data/config/politicas.json) ──

const POLICIES_PATH = path.join(__dirname, '..', '..', 'data', 'config', 'politicas.json');

/**
 * Enriquece los payloads de las decisiones con valores dinámicos del estado vivo
 * que json-rules-engine no puede expresar en JSON estático.
 */
function enrichPayload(decision, state) {
  if (!decision.payload) return decision;
  switch (decision.type) {
    case 'job.strategy.change':
      decision.payload.reason = `${state.empleo?.sin_respuesta || 0} aplicaciones sin respuesta`;
      break;
    case 'case.urgent.reminder':
      decision.payload.count = state.casos?.urgentes || 0;
      decision.payload.motivo = state.senales_estres?.motivo || 'casos_urgentes_activos';
      break;
    case 'study.reminder':
      decision.payload.count = state.casos?.vencidos || 0;
      decision.payload.horas_libres = state.sistema?.horas_libres_hoy || 0;
      break;
    case 'system.escalate':
      const errCount = state.sistema?.errores_24h || 0;
      decision.payload.errors = errCount;
      decision.payload.message = `${errCount} errores en 24h`;
      break;
    case 'study.suggest':
      decision.payload.horas_libres = state.sistema?.horas_libres_hoy || 0;
      break;
  }
  return decision;
}

// ── Rule-based think (declarativo con json-rules-engine) ──

async function ruleThink(state) {
  let policies;
  try {
    policies = JSON.parse(fs.readFileSync(POLICIES_PATH, 'utf8'));
  } catch (e) {
    console.error('[think] Error al leer politicas.json:', e.message);
    return [];
  }

  const engine = new Engine();
  for (const policy of policies) {
    engine.addRule(policy);
  }

  let events;
  try {
    const result = await engine.run({ state });
    events = result.events;
  } catch (e) {
    console.error('[think] Error en engine.run():', e.message);
    return [];
  }

  return events.map(e => enrichPayload(e.params, state));
}

// ── LLM think (solo cuando las reglas no alcanzan) ──

function needsLLM(state) {
  return state.casos.urgentes > 1 || (state.senales_estres.alto && state.empleo.sin_respuesta > 5);
}

async function llmThink(state) {
  const result = await decide('decision', {
    casos_abiertos: state.casos.abiertos,
    urgentes: state.casos.urgentes,
    vencidos: state.casos.vencidos,
    empleo: state.empleo,
    estudio: state.estudio,
    sistema: state.sistema,
    estres: state.senales_estres.alto ? state.senales_estres.motivo : 'normal',
    metas: getActive().map(g => g.label),
  });

  return (result.decisiones || []).map(d => ({
    ...d,
    priority: d.priority || 'normal',
    source: 'jarvis.llm',
  }));
}

// ── Main think ──

async function think(state) {
  const rules = await ruleThink(state);
  let llm = [];

  if (needsLLM(state)) {
    llm = await llmThink(state);
  }

  const all = [...rules, ...llm];
  logDecision(state, all);

  return all;
}

// ── Execute decisions (emit to event bus) ──

function execute(decisions) {
  for (const d of decisions) {
    bus.emit(d.type, d.payload, { source: d.source || 'jarvis', priority: d.priority || 'normal' });
  }
}

module.exports = { think, execute, getDecisionLog, needsLLM };
