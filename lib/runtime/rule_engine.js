/**
 * lib/runtime/rule_engine.js
 *
 * Motor de reglas determinístico. Sin IA.
 * Envuelve json-rules-engine con operadores custom para wildcards.
 * Toma un email y devuelve las acciones a ejecutar.
 *
 * Reglas en data/config/rules.json
 */

const path = require('node:path');
const fs = require('node:fs');
const { Engine } = require('json-rules-engine');

const RULES_PATH = path.resolve(__dirname, '..', '..', 'data', 'config', 'rules.json');

// ── Cache ──
let _cachedRules = null;
let _lastModified = 0;

function loadRules() {
  try {
    const stat = fs.statSync(RULES_PATH);
    if (_cachedRules && stat.mtimeMs === _lastModified) {
      return _cachedRules;
    }
    _cachedRules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    _lastModified = stat.mtimeMs;
    return _cachedRules;
  } catch {
    return _cachedRules || [];
  }
}

// ── Custom Operators ──

/**
 * Wildcard match: "text" matches "*@domain*", "prefix*", "*suffix", or exact
 */
function wildcardMatch(text, pattern) {
  const t = (text || '').toLowerCase();
  const p = (pattern || '').toLowerCase();
  if (p === '*') return true;
  if (p.startsWith('*') && p.endsWith('*')) return t.includes(p.slice(1, -1));
  if (p.startsWith('*')) return t.endsWith(p.slice(1));
  if (p.endsWith('*')) return t.startsWith(p.slice(0, -1));
  return t === p;
}

/**
 * Array wildcard: text matches ANY pattern in the array
 */
function wildcardArrayMatch(text, patterns) {
  if (!Array.isArray(patterns)) return false;
  return patterns.some(p => wildcardMatch(text, p));
}

/**
 * Array contains: text contains ANY substring from array
 */
function containsAny(text, substrings) {
  if (!Array.isArray(substrings)) return false;
  const t = (text || '').toLowerCase();
  return substrings.some(s => t.includes((s || '').toLowerCase()));
}

/**
 * Array anyWord: any keyword appears in combined text
 */
function anyWordInText(text, words) {
  if (!Array.isArray(words)) return false;
  const t = (text || '').toLowerCase();
  return words.some(w => t.includes((w || '').toLowerCase()));
}

// ── Rule Conversion ──

function buildEngine(rules) {
  const engine = new Engine();

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    const m = rule.match;
    if (!m) continue;

    const conditions = { all: [] };

    // from: wildcard match on email.from
    if (m.from && Array.isArray(m.from)) {
      conditions.all.push({
        fact: 'from',
        operator: 'wildcardArrayMatch',
        value: m.from,
      });
    }

    // fromContains: substring in from
    if (m.fromContains && Array.isArray(m.fromContains)) {
      conditions.all.push({
        fact: 'from',
        operator: 'containsAny',
        value: m.fromContains,
      });
    }

    // subject: wildcard match on email.subject
    if (m.subject && Array.isArray(m.subject)) {
      conditions.all.push({
        fact: 'subject',
        operator: 'wildcardArrayMatch',
        value: m.subject,
      });
    }

    // subjectContains: substring in subject
    if (m.subjectContains && Array.isArray(m.subjectContains)) {
      conditions.all.push({
        fact: 'subject',
        operator: 'containsAny',
        value: m.subjectContains,
      });
    }

    // anyWord: keyword anywhere in combined text
    if (m.anyWord && Array.isArray(m.anyWord)) {
      conditions.all.push({
        fact: 'text',
        operator: 'anyWordInText',
        value: m.anyWord,
      });
    }

    if (conditions.all.length === 0) continue;

    engine.addRule({
      name: rule.name,
      priority: priorityToNumber(rule.priority),
      conditions,
      event: {
        type: 'matched',
        params: {
          ...rule.actions,
          ruleName: rule.name,
          priority: rule.priority,
          label: rule.label || rule.actions.label || null,
        },
      },
    });
  }

  return engine;
}

function priorityToNumber(priority) {
  const order = { P0: 0, P1: 10, P2: 20, P3: 30 };
  return order[priority] ?? 100;
}

// ── Public API (idéntica a la versión anterior) ──

async function matchAllAsync(email) {
  const rules = loadRules();
  const engine = buildEngine(rules);

  engine.addOperator('wildcardArrayMatch', (factValue, jsonValue) =>
    wildcardArrayMatch(factValue, jsonValue)
  );
  engine.addOperator('containsAny', (factValue, jsonValue) =>
    containsAny(factValue, jsonValue)
  );
  engine.addOperator('anyWordInText', (factValue, jsonValue) =>
    anyWordInText(factValue, jsonValue)
  );

  const facts = buildFacts(email);
  const results = [];

  engine.on('success', (event) => {
    results.push(event.params);
  });

  try {
    await engine.run(facts);
  } catch (e) {
    console.error('[rule_engine] Error en engine.run():', e.message);
    return matchAllSync(email);
  }

  results.sort((a, b) => (priorityToNumber(a.priority) || 100) - (priorityToNumber(b.priority) || 100));
  return results;
}

function matchAllSync(email) {
  const rules = loadRules();
  const results = [];

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    if (!matchRuleLegacy(email, rule)) continue;

    const actions = { ...rule.actions };
    actions.ruleName = rule.name;
    if (rule.priority) actions.priority = rule.priority;
    if (rule.label) actions.label = rule.label;

    results.push(actions);
  }

  return results;
}

function matchAll(email) {
  return matchAllSync(email);
}

// Keep legacy matching as primary (zero-risk) while json-rules-engine is the upgrade path
function matchRuleLegacy(email, rule) {
  const m = rule.match;
  if (!m) return false;

  const from = (email.from || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();
  const body = (email.body || email.snippet || '').toLowerCase();
  const text = from + ' ' + subject + ' ' + body;

  if (m.from && Array.isArray(m.from)) {
    const fromMatch = wildcardArrayMatch(from, m.from) ||
      wildcardArrayMatch((email.from || '').split('<')[1]?.replace('>', '')?.trim() || '', m.from);
    if (!fromMatch) return false;
  }

  if (m.subject && Array.isArray(m.subject)) {
    if (!wildcardArrayMatch(subject, m.subject)) return false;
  }

  if (m.fromContains && Array.isArray(m.fromContains)) {
    if (!containsAny(from, m.fromContains)) return false;
  }

  if (m.subjectContains && Array.isArray(m.subjectContains)) {
    if (!containsAny(subject, m.subjectContains)) return false;
  }

  if (m.anyWord && Array.isArray(m.anyWord)) {
    if (!anyWordInText(text, m.anyWord)) return false;
  }

  return true;
}

function highestPriority(actions) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return actions.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9))[0] || {};
}

function buildFacts(email) {
  return {
    from: email.from || '',
    subject: email.subject || '',
    body: email.body || email.snippet || '',
    text: [email.from, email.subject, email.body || email.snippet].filter(Boolean).join(' '),
  };
}

// Export json-rules-engine engine builder for advanced use
function createEngine() {
  const rules = loadRules();
  const engine = buildEngine(rules);

  engine.addOperator('wildcardArrayMatch', (factValue, jsonValue) =>
    wildcardArrayMatch(factValue, jsonValue)
  );
  engine.addOperator('containsAny', (factValue, jsonValue) =>
    containsAny(factValue, jsonValue)
  );
  engine.addOperator('anyWordInText', (factValue, jsonValue) =>
    anyWordInText(factValue, jsonValue)
  );

  return engine;
}

module.exports = { matchAll, matchAllAsync, highestPriority, loadRules, createEngine };
