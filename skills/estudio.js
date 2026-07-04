const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'estudio',
  nombre: 'Estudio SENA/CESDE',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const est = vital.estudio || {};
    const sena = est.sena || {};
    const cesde = est.cesde || {};
    return `[SKILL: Estudio]
- SENA: ${sena.programa || 'sin datos'} (ficha ${sena.ficha || '?'}) - Fin estimado: ${sena.fin_estimado || '?'}
- CESDE: ${(cesde.cursos || []).join(', ') || 'sin datos'}
- Recordar: horarios de clase, entregas de talleres, link de Teams/meet`;
  }
};
