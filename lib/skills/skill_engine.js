/**
 * lib/skill_engine.js
 *
 * Skill Engine — sistema formal de habilidades sobre el Event Bus.
 *
 * Cada skill es una unidad con:
 *   - name: identificador único
 *   - trigger: evento que la activa ("*" para todos)
 *   - input: array de campos esperados
 *   - run(event): función que ejecuta la skill
 *   - description: qué hace
 *   - version: semver
 *
 * El Engine escucha todos los eventos del bus, hace match con skills
 * registradas, y ejecuta la que corresponda.
 *
 * Uso:
 *   const engine = require('./lib/skill_engine');
 *   engine.register(skillObject);
 *   engine.list();
 *   engine.init(); // conecta al event bus
 */

const bus = require('../events/event_bus');

const registry = new Map(); // name → skill

// ── Init: conectar al event bus ──

function init() {
  // Re-register all skills when new ones are added
  for (const [name, skill] of registry) {
    registerHandler(skill);
  }
}

function registerHandler(skill) {
  // Remove old handler if re-registering
  if (skill._off) skill._off();

  skill._off = bus.on(skill.trigger, async (envelope) => {
    if (!skill.enabled) return;
    await runSkill(skill, envelope);
  });
}

function register(skill) {
  if (!skill.name) throw new Error('Skill must have a name');
  if (!skill.run) throw new Error('Skill must have a run() function');

  const entry = {
    name: skill.name,
    description: skill.description || '',
    trigger: skill.trigger || 'jarvis.cycle',
    input: skill.input || [],
    run: skill.run,
    version: skill.version || '1.0.0',
    enabled: skill.enabled !== false,
    createdAt: new Date().toISOString(),
  };

  registry.set(skill.name, entry);
  registerHandler(entry);

  bus.emit('skill.registered', {
    name: skill.name,
    trigger: skill.trigger,
    version: skill.version,
  }, { source: 'skill_engine', priority: 'low' });
}

// ── Register ──

function register(skill) {
  if (!skill.name) throw new Error('Skill must have a name');
  if (!skill.run) throw new Error('Skill must have a run() function');

  registry.set(skill.name, {
    name: skill.name,
    description: skill.description || '',
    trigger: skill.trigger || '*',
    input: skill.input || [],
    run: skill.run,
    version: skill.version || '1.0.0',
    enabled: skill.enabled !== false,
    createdAt: new Date().toISOString(),
  });

  bus.emit('skill.registered', {
    name: skill.name,
    trigger: skill.trigger,
    version: skill.version,
  }, { source: 'skill_engine', priority: 'low' });
}

// ── Unregister ──

function unregister(name) {
  registry.delete(name);
}

// ── List ──

function list() {
  return [...registry.values()].map(s => ({
    name: s.name,
    description: s.description,
    trigger: s.trigger,
    input: s.input,
    version: s.version,
    enabled: s.enabled,
  }));
}

// ── Enable / Disable ──

function enable(name) {
  const s = registry.get(name);
  if (s) s.enabled = true;
}

function disable(name) {
  const s = registry.get(name);
  if (s) s.enabled = false;
}

// ── Run skill (wraps in event bus retry/DLQ) ──

async function runSkill(skill, envelope) {
  const input = { event: envelope, payload: envelope.payload, meta: envelope.meta };

  if (skill.input.length > 0) {
    const missing = skill.input.filter(f => envelope.payload[f] === undefined);
    if (missing.length > 0) {
      console.warn(`[skill] ${skill.name}: missing input fields: ${missing.join(', ')}`);
      return;
    }
  }

  const result = await Promise.resolve(skill.run(input));
  if (result) {
    bus.emit(result.event, result.payload, { source: `skill.${skill.name}`, priority: result.priority || 'normal' });
  }
}

module.exports = { init, register, unregister, list, enable, disable };
