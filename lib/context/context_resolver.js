const fs = require('node:fs');
const path = require('node:path');
const { PATHS, DIR } = require('../data/paths');

const DATA_DIR = DIR.DATA;
const VITAL_PATH = PATHS.VITAL;

const SKILL_ROUTER_PATH = PATHS.SKILL_ROUTER;
const USER_INDEX_PATH = PATHS.USER_SKILLS_INDEX;
const SISTEMA_INDEX_PATH = PATHS.SISTEMA_SKILLS_INDEX;
const MEMORY_ENGINE_PATH = path.join(__dirname, '..', 'lib', 'memory', 'memory_engine.js');
const hasSkills = fs.existsSync(SKILL_ROUTER_PATH);
const hasMemory = fs.existsSync(MEMORY_ENGINE_PATH);

function readJSONSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

function readTextSafe(p) {
  try { return fs.readFileSync(p, 'utf8').trim(); }
  catch { return ''; }
}

function loadSenaContext() {
  const senaDir = DIR.SENA;
  const cursoPath = PATHS.SENA_CURSO;
  const deadlinesPath = PATHS.SENA_DEADLINES_FILE;
  const partes = [];

  const curso = readJSONSafe(cursoPath);
  if (curso?.nombre) {
    partes.push(`[SENA] ${curso.nombre}`);
    const tareas = [];
    for (const sec of (curso.secciones || [])) {
      for (const act of (sec.actividades || [])) {
        if (act.tipo === 'tarea' || act.tipo === 'cuestionario') {
          tareas.push(`${act.nombre.replace(/  /g, ' ').trim()} [${sec.nombre}]`);
        }
      }
    }
    if (tareas.length > 0) partes.push(`[SENA_EVIDENCIAS] ${tareas.join(' | ')}`);
  }

  const deadlines = readJSONSafe(deadlinesPath);
  if (deadlines?.deadlines?.length > 0) {
    const venc = deadlines.deadlines
      .map(d => d.nombre.replace(/\s+/g, ' ').trim())
      .join(' | ');
    partes.push(`[SENA_VENCIMIENTOS] ${venc}`);
  }

  return partes.join('\n');
}

function buildCompactContext() {
  const vital = readJSONSafe(VITAL_PATH);
  const pendingRaw = readJSONSafe(PATHS.PENDING);
  const notas = readTextSafe(PATHS.NOTAS);

  const parts = [];
  const senaCtx = loadSenaContext();
  if (senaCtx) parts.push(senaCtx);

  // Memory Engine - hechos recientes (ultimos 10, todas las categorias)
  if (hasMemory) {
    try {
      const memory = require(MEMORY_ENGINE_PATH);
      const allHechos = memory.loadHechos().hechos;
      if (allHechos.length > 0) {
        // Show most recent from each category to ensure coverage
        const byCat = {};
        for (let i = allHechos.length - 1; i >= 0; i--) {
          const h = allHechos[i];
          if (!byCat[h.categoria]) byCat[h.categoria] = [];
          if (byCat[h.categoria].length < 3) byCat[h.categoria].push(h.hecho);
        }
        const lines = [];
        for (const [cat, hechos] of Object.entries(byCat)) {
          lines.push(`[MEM:${cat.toUpperCase()}] ${hechos.join(' | ')}`);
        }
        if (lines.length > 0) parts.push(lines.join('\n'));
      }
    } catch {}
  }

  if (vital) {
    const p = vital.perfil || {};
    parts.push(`[PERFIL] ${p.nombre} | ${p.ciudad || p.pais || ''} | ${p.ocupacion || ''}`);

    const metas = vital.metas || {};
    if (metas.corto_plazo?.length) parts.push(`[METAS CP] ${metas.corto_plazo.join(' | ')}`);
    if (metas.mediano_plazo?.length) parts.push(`[METAS MP] ${metas.mediano_plazo.join(' | ')}`);

    const estudio = vital.estudio || {};
    if (estudio.sena?.programa) parts.push(`[SENA] ${estudio.sena.programa} (${estudio.sena.fin_estimado || '?'})`);
    if (estudio.cesde?.cursos?.length) parts.push(`[CESDE] ${estudio.cesde.cursos.join(', ')}`);

    const trabajo = vital.trabajo || {};
    if (trabajo.buscando) parts.push('[TRABAJO] Buscando activamente');
    if (trabajo.entrevistas_pendientes?.length) parts.push(`[ENTREVISTAS] ${trabajo.entrevistas_pendientes.join(' | ')}`);
    if (trabajo.industrias_interes?.length) parts.push(`[INDUSTRIAS] ${trabajo.industrias_interes.join(', ')}`);

    const legal = vital.legal_financiero || {};
    if (legal.dian?.estado) parts.push(`[DIAN] ${legal.dian.estado}`);
    if (legal.simit?.estado) parts.push(`[SIMIT] ${legal.simit.estado}`);

    const salud = vital.salud || {};
    if (salud.eps) parts.push(`[EPS] ${salud.eps}`);
    if (salud.citas_pendientes?.length) parts.push(`[CITAS] ${salud.citas_pendientes.join(' | ')}`);

    if (vital.notas_vida?.length) {
      const recientes = vital.notas_vida.slice(-3);
      parts.push(`[NOTAS_VIDA] ${recientes.join(' | ')}`);
    }

    if (vital.recordatorios_recurrentes?.length) {
      parts.push(`[RECORDATORIOS] ${vital.recordatorios_recurrentes.join(' | ')}`);
    }
  }

  if (pendingRaw) {
    const tasks = Array.isArray(pendingRaw) ? pendingRaw : pendingRaw.tasks || [];
    const pendingTasks = tasks.filter(t => !t.done).slice(0, 5);
    if (pendingTasks.length) {
      parts.push(`[PENDIENTES] ${pendingTasks.map(t => t.text).join(' | ')}`);
    }
  }

  if (notas) {
    const lines = notas.split('\n').filter(l => l.trim()).slice(0, 8);
    if (lines.length) parts.push(`[NOTAS]\n${lines.join('\n')}`);
  }

  return parts.join('\n');
}

function appendSkills(base) {
  if (!hasSkills) return base;
  try {
    const router = require(SKILL_ROUTER_PATH);
    const skillCtx = router.getAllSkillContexts();
    if (skillCtx) base += '\n\n' + skillCtx;
    const systemBrief = router.getAllSystemSkillsBrief();
    if (systemBrief) base += '\n\n[SKILLS_SISTEMA]\n' + systemBrief;
  } catch {}
  return base;
}

function getContextSync() {
  return appendSkills(buildCompactContext());
}

function getContextForMessage(msg) {
  const base = buildCompactContext();

  // Memory Engine - hechos relevantes al mensaje
  let memCtx = '';
  if (hasMemory && msg) {
    try {
      const memory = require(MEMORY_ENGINE_PATH);
      memCtx = memory.getContextoRelevante(msg, 1500);
    } catch {}
  }

  if (!hasSkills || !msg) {
    return memCtx ? base + '\n\n' + memCtx : base;
  }

  try {
    const router = require(SKILL_ROUTER_PATH);
    const detected = router.detectSkills(msg);

    const parts = [base];
    for (const skill of detected) {
      if (skill.source === 'js') {
        try {
          const mod = require(path.join(BASE_DIR, 'skills', skill.id + '.js'));
          if (mod && typeof mod.getContext === 'function') {
            const ctx = mod.getContext();
            if (ctx) parts.push(ctx);
          }
        } catch {}
      } else {
        const ctx = loadSystemOrUserSkill(skill.id);
        if (ctx) parts.push(ctx);
      }
    }

    return parts.join('\n\n') + (memCtx ? '\n\n' + memCtx : '');
  } catch {
    return base + (memCtx ? '\n\n' + memCtx : '');
  }
}

function loadSystemOrUserSkill(id) {
  const userIndex = readJSONSafe(USER_INDEX_PATH);
  if (userIndex) {
    const entry = userIndex.skills.find(s => s.id === id);
    if (entry) {
      try {
        const content = fs.readFileSync(entry.ruta, 'utf8');
        const head = content.split('\n').slice(0, 30).join('\n');
        return `[USER SKILL: ${entry.nombre} v${entry.version}]\n${head}\n...`;
      } catch {
        return `[USER SKILL: ${entry.nombre}] no disponible`;
      }
    }
  }
  const systemIndex = readJSONSafe(SISTEMA_INDEX_PATH);
  if (systemIndex) {
    const entry = systemIndex.skills.find(s => s.id === id);
    if (entry) {
      try {
        const content = fs.readFileSync(entry.ruta, 'utf8');
        const head = content.split('\n').slice(0, 30).join('\n');
        return `[SKILL SISTEMA: ${entry.nombre} v${entry.version}]\n${head}\n...`;
      } catch {
        return `[SKILL SISTEMA: ${entry.nombre}] no disponible`;
      }
    }
  }
  return null;
}

async function getContext() {
  return getContextSync();
}

module.exports = { getContext, getContextSync, getContextForMessage };
