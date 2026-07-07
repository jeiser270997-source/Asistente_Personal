const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const VITAL_FILE = path.join(DATA_DIR, 'contexto_vital.json');
const APPS_FILE = path.join(DATA_DIR, 'aplicaciones.json');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let AppStore = null;
if (USE_SQLITE) {
  AppStore = require('../runtime/stores/ApplicationStore');
}

function loadVital() {
  try {
    return JSON.parse(fs.readFileSync(VITAL_FILE, 'utf8'));
  } catch {
    return { perfil: {}, metas: {} };
  }
}

function evaluateFit(empresa, cargo, detalles) {
  const vital = loadVital();
  const text = `${empresa} ${cargo} ${detalles || ''}`.toLowerCase();
  const habilidades = (vital.estudio?.habilidades || []).map(h => h.toLowerCase());
  const industrias = (vital.trabajo?.industrias_interes || []).map(i => i.toLowerCase());

  let score = 50;
  const razones = [];

  if (habilidades.some(h => text.includes(h))) {
    score += 15; razones.push('coincide con habilidades');
  }
  if (industrias.some(i => text.includes(i))) {
    score += 10; razones.push('industria de interes');
  }
  if (text.includes('desarrollador') || text.includes('developer') || text.includes('programador')) {
    score += 10; razones.push('rol de desarrollo');
  }
  if (text.includes('senior') || text.includes('lider') || text.includes('manager')) {
    score -= 10; razones.push('rol senior, posiblemente no apto');
  }
  if (text.includes('sin experiencia') || text.includes('junior') || text.includes('trainee')) {
    score += 10; razones.push('rol para entrada/sin experiencia');
  }
  if (text.includes('ingles') || text.includes('english')) {
    if (!vital.perfil.idiomas?.some(i => i.toLowerCase().includes('ingles'))) {
      score -= 10; razones.push('requiere ingles no registrado');
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    compatible: score >= 60,
    razones: razones.length ? razones : ['evaluacion basica']
  };
}

// ── Load/save helpers (JSON fallback) ──

function loadAppsJson() {
  try { return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8')); } catch { return []; }
}

function saveAppsJson(apps) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf8');
}

// ── Public API ──

function logApplication({ empresa, cargo, plataforma, url, detalles, fecha_aplicacion }) {
  const evalResult = evaluateFit(empresa, cargo, detalles);

  if (USE_SQLITE) {
    const match = AppStore.findByEmpresaCargo(empresa, cargo);
    if (match) return { duplicado: true, id: match.id };

    const id = AppStore.create({
      empresa, cargo, plataforma, url, detalles,
      fecha_aplicacion: fecha_aplicacion || new Date().toISOString().split('T')[0],
      estado: 'aplicada',
      evaluacion: evalResult,
      historial: [{ fecha: new Date().toISOString(), evento: 'aplicacion_enviada' }]
    });
    return { duplicado: false, id, evaluacion: evalResult };
  }

  const apps = loadAppsJson();
  const match = apps.find(a => a.empresa === empresa && a.cargo === cargo);
  if (match) return { duplicado: true, id: match.id };

  const id = `app_${Date.now()}`;
  apps.push({
    id, empresa, cargo, plataforma, url, detalles,
    fecha_aplicacion: fecha_aplicacion || new Date().toISOString().split('T')[0],
    estado: 'aplicada',
    evaluacion: evalResult,
    historial: [{ fecha: new Date().toISOString(), evento: 'aplicacion_enviada' }]
  });
  saveAppsJson(apps);
  return { duplicado: false, id, evaluacion: evalResult };
}

function updateEstado(id, nuevoEstado, evento) {
  if (USE_SQLITE) {
    const app = AppStore.getById(id);
    if (!app) return false;
    const historial = [...(app.historial || []), { fecha: new Date().toISOString(), evento: evento || `estado_${nuevoEstado}` }];
    AppStore.update(id, { estado: nuevoEstado, historial });
    return true;
  }

  const apps = loadAppsJson();
  const app = apps.find(a => a.id === id);
  if (!app) return false;
  app.estado = nuevoEstado;
  if (!app.historial) app.historial = [];
  app.historial.push({ fecha: new Date().toISOString(), evento: evento || `estado_${nuevoEstado}` });
  saveAppsJson(apps);
  return true;
}

function listApps(filtro) {
  if (USE_SQLITE) {
    return AppStore.getAll(filtro);
  }

  let apps = loadAppsJson();
  if (filtro?.estado) apps = apps.filter(a => a.estado === filtro.estado);
  if (filtro?.plataforma) apps = apps.filter(a => a.plataforma?.toLowerCase() === filtro.plataforma.toLowerCase());
  if (filtro?.compatibles) apps = apps.filter(a => (a.evaluacion?.compatible));
  apps.sort((a, b) => new Date(b.fecha_aplicacion) - new Date(a.fecha_aplicacion));
  return apps;
}

function getStats() {
  if (USE_SQLITE) {
    return AppStore.getStats();
  }

  const apps = loadAppsJson();
  return {
    total: apps.length,
    activas: apps.filter(a => a.estado === 'aplicada').length,
    entrevistas: apps.filter(a => a.estado === 'entrevista').length,
    rechazadas: apps.filter(a => a.estado === 'rechazada').length,
    aceptadas: apps.filter(a => a.estado === 'aceptada').length,
    compatibles: apps.filter(a => a.evaluacion?.compatible).length,
    no_compatibles: apps.filter(a => a.evaluacion && !a.evaluacion.compatible).length,
    plataformas: [...new Set(apps.map(a => a.plataforma).filter(Boolean))]
  };
}

function formatForContext(maxApps = 5) {
  const apps = USE_SQLITE ? AppStore.getAll() : loadAppsJson();
  const activas = (Array.isArray(apps) ? apps : []).filter(a => a.estado === 'aplicada' || a.estado === 'entrevista').slice(0, maxApps);
  if (activas.length === 0) return '[APLICACIONES] Ninguna activa';
  const lines = activas.map(a =>
    `- ${a.empresa} | ${a.cargo} | ${a.plataforma || '?'} | ${a.estado} | fit: ${a.evaluacion?.score || '?'}%`
  );
  return `[APLICACIONES]\n${lines.join('\n')}`;
}

module.exports = { logApplication, updateEstado, listApps, getStats, evaluateFit, formatForContext };
