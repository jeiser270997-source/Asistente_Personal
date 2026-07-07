/**
 * lib/think.js — El cerebro de Jarvis
 *
 * Toma un StateSnapshot y devuelve decisiones.
 * Empieza con reglas, escala a LLM cuando necesita
 * razonamiento complejo.
 *
 * Cada decisión es un evento que se emite al Event Bus.
 */

const { getState } = require('../context/state_snapshot');
const { getActive } = require('../runtime/goals');
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

// ── Policy Thresholds ──

const POLICIES = [
  {
    id: 'overload_recovery',
    condition: (s) => s.senales_estres.alto,
    action: () => ({
      type: 'schedule.block',
      payload: { hours: 2, reason: 'recuperacion_automatica' },
      priority: 'high',
      source: 'jarvis.policy.overload',
    }),
    priority: 7,
  },
  {
    id: 'job_stagnation',
    condition: (s) => s.empleo.sin_respuesta > 10,
    action: (s) => ({
      type: 'job.strategy.change',
      payload: { mode: 'aggressive', reason: `${s.empleo.sin_respuesta} aplicaciones sin respuesta` },
      priority: 'high',
      source: 'jarvis.policy.job_stagnation',
    }),
    priority: 8,
  },
  {
    id: 'urgent_case',
    condition: (s) => s.casos.urgentes > 0,
    action: (s) => ({
      type: 'case.urgent.reminder',
      payload: { count: s.casos.urgentes, motivo: s.senales_estres.motivo },
      priority: 'high',
      source: 'jarvis.policy.urgent',
    }),
    priority: 10,
  },
  {
    id: 'study_overdue',
    condition: (s) => s.casos.vencidos > 0 && s.estudio.casos_sena > 0,
    action: (s) => ({
      type: 'study.reminder',
      payload: { count: s.casos.vencidos, horas_libres: s.sistema.horas_libres_hoy },
      priority: 'normal',
      source: 'jarvis.policy.study',
    }),
    priority: 6,
  },
  {
    id: 'errors_escalation',
    condition: (s) => s.sistema.errores_24h > 3,
    action: (s) => ({
      type: 'system.escalate',
      payload: { errors: s.sistema.errores_24h, message: `${s.sistema.errores_24h} errores en 24h` },
      priority: 'high',
      source: 'jarvis.policy.errors',
    }),
    priority: 9,
  },
  {
    id: 'free_time_suggestion',
    condition: (s) => s.sistema.horas_libres_hoy >= 2 && s.estudio.casos_sena > 0,
    action: (s) => ({
      type: 'study.suggest',
      payload: { horas_libres: s.sistema.horas_libres_hoy, sugerencia: 'Bloque de estudio disponible hoy' },
      priority: 'low',
      source: 'jarvis.policy.free_time',
    }),
    priority: 3,
  },
];

// ── Rule-based think ──

function ruleThink(state) {
  const decisions = [];

  for (const policy of POLICIES.sort((a, b) => b.priority - a.priority)) {
    try {
      if (policy.condition(state)) {
        decisions.push(policy.action(state));
      }
    } catch (e) {
      console.error(`[think] Policy ${policy.id} error:`, e.message);
    }
  }

  return decisions;
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
  const rules = ruleThink(state);
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

module.exports = { think, execute, getDecisionLog, needsLLM, POLICIES };
