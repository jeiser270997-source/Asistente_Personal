/**
 * skills/router.js
 * Enrutador unificado de habilidades de LifeOS (FIX-007).
 * Consume un único índice unificado (skills_index.json) para resolver
 * de forma dinámica habilidades de tipo JS, Markdown y del Sistema.
 */
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = __dirname;
const INDEX_PATH = path.join(SKILLS_DIR, 'skills_index.json');

function loadIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  } catch (err) {
    console.error(`[router] No se pudo leer el índice unificado: ${err.message}`);
    return { skills: [] };
  }
}

function loadSkill(id) {
  try {
    return require(path.join(SKILLS_DIR, id));
  } catch (err) {
    console.warn(`[router] Skill JS no disponible o error cargando "${id}": ${err.message.substring(0, 80)}`);
    return null;
  }
}

function loadMDSkill(skillEntry) {
  try {
    // Soportar tanto rutas relativas como absolutas de Windows (FIX-007)
    const absolutePath = path.isAbsolute(skillEntry.ruta)
      ? skillEntry.ruta
      : path.resolve(SKILLS_DIR, '..', skillEntry.ruta);

    const content = fs.readFileSync(absolutePath, 'utf8');
    const lines = content.split('\n');
    const head = lines.slice(0, 30).join('\n');
    return `[SKILL ${skillEntry.type.toUpperCase()}: ${skillEntry.nombre} v${skillEntry.version || '1.0'}]\n${head}\n...`;
  } catch (err) {
    return `[SKILL ${skillEntry.type.toUpperCase()}: ${skillEntry.nombre}] no disponible o ruta inválida`;
  }
}

function detectSkills(texto) {
  const idx = loadIndex();
  const lower = texto.toLowerCase();
  const matches = [];

  for (const skill of idx.skills) {
    const matchCount = skill.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      matches.push({ ...skill, matchCount });
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
        if (skill.type === 'js') {
          const mod = loadSkill(skill.id);
          if (mod && typeof mod.getContext === 'function') {
            const ctx = mod.getContext();
            if (ctx) parts.push(ctx);
          }
        } else {
          const ctx = loadMDSkill(skill);
          if (ctx) parts.push(ctx);
        }
      } catch (err) {
        console.warn(`[router] Error cargando contexto de skill "${skill.id}": ${err.message.substring(0, 80)}`);
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
    const idx = loadIndex();
    const parts = [];

    for (const skill of idx.skills) {
      if (skill.type === 'js') {
        try {
          const mod = loadSkill(skill.id);
          if (mod && typeof mod.getContext === 'function') {
            const ctx = mod.getContext();
            if (ctx) parts.push(ctx);
          }
        } catch (err) {
          console.warn(`[router] Error cargando context de skill "${skill.id}": ${err.message.substring(0, 60)}`);
        }
      }
    }

    return parts.join('\n\n');
  } catch (err) {
    console.warn(`[router] Error en getAllSkillContexts: ${err.message.substring(0, 60)}`);
    return '';
  }
}

function getBriefByType(type) {
  try {
    const idx = loadIndex();
    return idx.skills
      .filter(s => s.type === type)
      .map(s => `- ${s.nombre} (v${s.version || '1.0'}): ${s.keywords.slice(0, 5).join(', ')}...`)
      .join('\n');
  } catch {
    return '';
  }
}

function getAllSystemSkillsBrief() {
  return getBriefByType('sistema');
}

function getAllUserSkillsBrief() {
  return getBriefByType('md');
}

module.exports = { detectSkills, getContextForText, getAllSkillContexts, getAllUserSkillsBrief, getAllSystemSkillsBrief, loadMDSkill };
