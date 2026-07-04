const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'legal',
  nombre: 'Legal Colombia',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const legal = vital.legal_financiero || {};
    return `[SKILL: Legal Colombia]
- SIMIT: ${legal.simit?.estado || 'sin informacion'}
- Ultima gestion SIMIT: ${legal.simit?.ultima_gestion || 'ninguna'}
- Fiscalia/denuncias: pendientes de atencion
- Temas clave: comparendos SIMIT, cobro coactivo, denuncias fiscalia, contratos, tutelas
- Recordar: plazos para responder requerimientos, terminos de prescripcion`;
  }
};
