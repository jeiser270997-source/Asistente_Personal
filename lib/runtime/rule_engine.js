/**
 * lib/rule_engine.js
 *
 * Motor de reglas determinístico. Sin IA.
 * Toma un email y devuelve las acciones a ejecutar.
 *
 * Reglas en data/rules.json
 */

const path = require('path');
const fs = require('fs');

const RULES_PATH = path.resolve(__dirname, '..', 'data', 'rules.json');

function loadRules() {
  try { return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8')); }
  catch { return []; }
}

function matchPattern(text, pattern) {
  if (pattern === '*') return true;
  if (pattern.startsWith('*') && pattern.endsWith('*')) {
    return (text || '').toLowerCase().includes(pattern.slice(1, -1).toLowerCase());
  }
  if (pattern.startsWith('*')) {
    return (text || '').toLowerCase().endsWith(pattern.slice(1).toLowerCase());
  }
  if (pattern.endsWith('*')) {
    return (text || '').toLowerCase().startsWith(pattern.slice(0, -1).toLowerCase());
  }
  return (text || '').toLowerCase() === pattern.toLowerCase();
}

function matchRule(email, rule) {
  const m = rule.match;
  if (!m) return false;

  const from = (email.from || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();
  const body = (email.body || email.snippet || '').toLowerCase();
  const text = from + ' ' + subject + ' ' + body;

  // Si hay from exacto, check
  if (m.from && Array.isArray(m.from)) {
    const fromMatch = m.from.some(p => matchPattern(from, p) || matchPattern(from.split('<')[1]?.replace('>','')?.trim(), p));
    if (!fromMatch) return false;
  }

  // Si hay subject patterns
  if (m.subject && Array.isArray(m.subject)) {
    if (!m.subject.some(p => matchPattern(subject, p))) return false;
  }

  // Si hay fromContains (substring en from)
  if (m.fromContains && Array.isArray(m.fromContains)) {
    if (!m.fromContains.some(p => from.includes(p.toLowerCase()))) return false;
  }

  // Si hay subjectContains
  if (m.subjectContains && Array.isArray(m.subjectContains)) {
    if (!m.subjectContains.some(p => subject.includes(p.toLowerCase()))) return false;
  }

  // Cualquier keyword en el texto completo
  if (m.anyWord && Array.isArray(m.anyWord)) {
    if (!m.anyWord.some(p => text.includes(p.toLowerCase()))) return false;
  }

  return true;
}

function matchAll(email) {
  const rules = loadRules();
  const results = [];

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    if (!matchRule(email, rule)) continue;

    // Colectar acciones
    const actions = { ...rule.actions };
    actions.ruleName = rule.name;
    if (rule.priority) actions.priority = rule.priority;
    if (rule.label) actions.label = rule.label;

    results.push(actions);
  }

  return results;
}

function highestPriority(actions) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return actions.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9))[0] || {};
}

module.exports = { matchAll, highestPriority, loadRules };
