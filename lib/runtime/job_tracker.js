const fs = require('node:fs');
const path = require('node:path');
const AppStore = require('../../runtime/stores/ApplicationStore');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const VITAL_FILE = path.join(DATA_DIR, 'contexto_vital.json');

function loadVital() {
  try { return JSON.parse(fs.readFileSync(VITAL_FILE, 'utf8')); } 
  catch { return { perfil: {}, metas: {} }; }
}

function evaluateFit(empresa, cargo, detalles) {
  const vital = loadVital();
  const text = `${empresa} ${cargo} ${detalles || ''}`.toLowerCase();
  
  let score = 50;
  const razones = [];

  // Filtro estricto de sábados (Si dice sábado/finde, se penaliza fuertemente)
  if (/(sábado|sabado|fines de semana|disponibilidad completa|domingo)/.test(text)) {
    score -= 50; 
    razones.push('horario incluye sábados (bloqueo estudio)');
  }

  // Ampliación del radar: QA + Soporte + Sistemas
  if (/(qa|tester|automatización|automation|playwright)/.test(text)) { score += 25; razones.push('rol core: QA'); }
  if (/(soporte|sistemas|mesa de ayuda|helpdesk|auxiliar ti|tecnico)/.test(text)) { score += 20; razones.push('rol afín: Soporte TI'); }
  if (/(desarrollador|developer|programador)/.test(text)) { score += 10; razones.push('rol desarrollo'); }
  
  if (/(senior|lider|manager|principal)/.test(text)) { score -= 15; razones.push('rol senior'); }
  if (/(sin experiencia|junior|trainee|practicante)/.test(text)) { score += 15; razones.push('entry level'); }
  
  if (/(ingles|english|bilingue)/.test(text) && !vital.perfil?.idiomas?.some(i => i.toLowerCase().includes('ingles'))) {
    score -= 10; razones.push('falta ingles avanzado');
  }

  return { score: Math.max(0, Math.min(100, score)), compatible: score >= 60, razones: razones.length ? razones : ['evaluacion basica'] };
}

function logApplication({ empresa, cargo, plataforma, url, detalles, fecha_aplicacion }) {
  const evalResult = evaluateFit(empresa, cargo, detalles);
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

function updateEstado(id, nuevoEstado, evento) {
  const app = AppStore.getById(id);
  if (!app) return false;
  const historial = [...(app.historial || []), { fecha: new Date().toISOString(), evento: evento || `estado_${nuevoEstado}` }];
  AppStore.update(id, { estado: nuevoEstado, historial });
  return true;
}

function listApps(filtro) {
  return AppStore.getAll(filtro);
}

function getStats() {
  return AppStore.getStats();
}

function formatForContext(maxApps = 5) {
  const apps = AppStore.getAll();
  const activas = apps.filter(a => a.estado === 'aplicada' || a.estado === 'entrevista').slice(0, maxApps);
  if (activas.length === 0) return '[APLICACIONES] Ninguna activa';
  return `[APLICACIONES]\n` + activas.map(a => `- ${a.empresa} | ${a.cargo} | ${a.plataforma || '?'} | ${a.estado} | fit: ${a.evaluacion?.score || '?'}%`).join('\n');
}

module.exports = { logApplication, updateEstado, listApps, getStats, evaluateFit, formatForContext };
