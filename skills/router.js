const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = __dirname;
const REGISTRY_PATH = path.join(SKILLS_DIR, 'registry.json');
const USER_INDEX_PATH = path.join(SKILLS_DIR, 'user_skills_index.json');
const SISTEMA_INDEX_PATH = path.join(SKILLS_DIR, 'skills_sistema_index.json');

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { skills: [] };
  }
}

function loadUserIndex() {
  try {
    return JSON.parse(fs.readFileSync(USER_INDEX_PATH, 'utf8'));
  } catch {
    return { skills: [] };
  }
}

function loadSystemIndex() {
  try {
    return JSON.parse(fs.readFileSync(SISTEMA_INDEX_PATH, 'utf8'));
  } catch {
    return { skills: [] };
  }
}

function loadSkill(id) {
  try {
    const mod = require(path.join(SKILLS_DIR, id));
    return mod;
  } catch (err) {
    console.warn(`[router] Skill no disponible o error cargando "${id}": ${err.message.substring(0, 80)}`);
    return null;
  }
}

function loadMDSkill(skillEntry) {
  try {
    const content = fs.readFileSync(skillEntry.ruta, 'utf8');
    const lines = content.split('\n');
    const head = lines.slice(0, 30).join('\n');
    return `[SKILL USER: ${skillEntry.nombre} v${skillEntry.version}]\n${head}\n...`;
  } catch {
    return `[SKILL USER: ${skillEntry.nombre}] no disponible`;
  }
}

function detectSkills(texto) {
  const registry = loadRegistry();
  const lower = texto.toLowerCase();
  const matches = [];

  for (const skill of registry.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ id: skill.id, matchCount, prioridad: skill.prioridad, source: 'js' });
    }
  }

  const userIndex = loadUserIndex();
  for (const skill of userIndex.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ id: skill.id, matchCount, prioridad: skill.prioridad, source: 'md' });
    }
  }

  const systemIndex = loadSystemIndex();
  for (const skill of systemIndex.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ id: skill.id, matchCount, prioridad: skill.prioridad, source: 'sistema' });
    }
  }

  matches.sort((a, b) => b.prioridad - a.prioridad || b.matchCount - a.matchCount);
  return matches;
}

function getContextForText(texto) {
  try {
    const matched = detectSkills(texto);
    if (matched.length === 0) return '';

    const parts = [];
    for (const skill of matched) {
      try {
        if (skill.source === 'js') {
          const mod = loadSkill(skill.id);
          if (mod && typeof mod.getContext === 'function') {
            const ctx = mod.getContext();
            if (ctx) parts.push(ctx);
          }
        } else if (skill.source === 'md') {
          const userIndex = loadUserIndex();
          const entry = userIndex.skills.find(s => s.id === skill.id);
          if (entry) {
            const ctx = loadMDSkill(entry);
            if (ctx) parts.push(ctx);
          }
        } else if (skill.source === 'sistema') {
          const systemIndex = loadSystemIndex();
          const entry = systemIndex.skills.find(s => s.id === skill.id);
          if (entry) {
            const ctx = loadMDSkill(entry);
            if (ctx) parts.push(ctx);
          }
        }
      } catch (err) {
        console.warn(`[router] Error obteniendo contexto para skill "${skill.id}": ${err.message.substring(0, 80)}`);
      }
    }

    return parts.join('\n\n');
  } catch (err) {
    console.warn(`[router] Error en getContextForText: ${err.message.substring(0, 80)}`);
    return '';
  }
}

function getAllSkillContexts() {
  try {
    const registry = loadRegistry();
    const parts = [];

    for (const skill of registry.skills) {
      try {
        const mod = loadSkill(skill.id);
        if (mod && typeof mod.getContext === 'function') {
          const ctx = mod.getContext();
          if (ctx) parts.push(ctx);
        }
      } catch (err) {
        console.warn(`[router] Error cargando skill "${skill.id}": ${err.message.substring(0, 60)}`);
      }
    }

    return parts.join('\n\n');
  } catch (err) {
    console.warn(`[router] Error en getAllSkillContexts: ${err.message.substring(0, 60)}`);
    return '';
  }
}

function getAllSystemSkillsBrief() {
  const systemIndex = loadSystemIndex();
  return systemIndex.skills.map(s =>
    `- ${s.nombre} (v${s.version}): ${s.keywords.slice(0, 5).join(', ')}...`
  ).join('\n');
}

function getAllUserSkillsBrief() {
  const userIndex = loadUserIndex();
  return userIndex.skills.map(s =>
    `- ${s.nombre} (v${s.version}): ${s.keywords.slice(0, 5).join(', ')}...`
  ).join('\n');
}

module.exports = { detectSkills, getContextForText, getAllSkillContexts, getAllUserSkillsBrief, getAllSystemSkillsBrief, loadMDSkill };
