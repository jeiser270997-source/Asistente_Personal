const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

function getAplicaciones() {
  try {
    return JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'aplicaciones.json'), 'utf8'));
  } catch { return []; }
}

module.exports = {
  id: 'laboral',
  nombre: 'Busqueda Laboral',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const apps = getAplicaciones();
    const activas = apps.filter(a => a.estado === 'aplicada' || a.estado === 'entrevista');
    const perfil = vital.perfil || {};
    const trabajo = vital.trabajo || {};
    const metas = vital.metas || {};
    return `[SKILL: Busqueda Laboral]
- Perfil: ${perfil.nombre} | ${perfil.ciudad || ''} | ${trabajo.tipo || perfil.ocupacion || ''}
- Meta: ${(metas.corto_plazo || []).join(', ') || 'conseguir empleo'}
- Postulaciones activas: ${activas.length}
- Entrevistas pendientes: ${(trabajo.entrevistas_pendientes || []).length}
- Industrias interes: ${(trabajo.industrias_interes || []).join(', ') || 'sin definir'}
- Plataformas: Computrabajo, LinkedIn, Solvo, Concentrix`;
  },
  getStats() {
    const apps = getAplicaciones();
    return {
      total: apps.length,
      activas: apps.filter(a => a.estado === 'aplicada' || a.estado === 'entrevista').length,
      rechazadas: apps.filter(a => a.estado === 'rechazada').length,
      entrevistas: apps.filter(a => a.estado === 'entrevista').length,
    };
  }
};
