const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'salud',
  nombre: 'Salud y Bienestar',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const salud = vital.salud || {};
    return `[SKILL: Salud y Bienestar]
- EPS: ${salud.eps || 'sin registrar'}
- Condiciones: ${(salud.condiciones || []).join(', ') || 'ninguna registrada'}
- Medicamentos: ${(salud.medicamentos || []).join(', ') || 'ninguno registrado'}
- Citas pendientes: ${(salud.citas_pendientes || []).join(', ') || 'ninguna'}`;
  }
};
