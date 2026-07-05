const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'tributaria',
  nombre: 'Tributaria Colombia - Defensa DIAN v6.0',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const dian = vital.legal_financiero?.dian || {};

    return `[SKILL: Tributaria Colombia v6.0 - Defensa DIAN]
UVT 2026: $52,374 | SMMLV 2026: $1,623,500
DIAN Jeiser: ${dian.estado || 'sin informacion'} | Ultima gestion: ${dian.ultima_gestion || 'ninguna'}
- AG2023: deuda $9.8M, prescripcion ~09/2029. REGLA HIERRO: NO firmar 814.
- AG2024: radicada (sancion $524K mora). AG2025: NO OBLIGADO.
- UGPP 2023: cerrado favorable 12/06/2026. Coherencia DIAN/UGPP critica.
- DIAN Peticion 2026DP000161298: asignada 09/06/2026.
- Tesis nuclear: Art. 26 ET. Ingreso = enriquecimiento real + incremento patrimonial neto + permanencia.
- Topes 2026: declara renta >$73.3M ingresos o patrimonio. Prescripcion cobro: 5 años.
- Habitualidad: flujo sin utilidad real NO es renta. RUT consistente es defensa clave.
- Procedimiento completo en SKILL_TRIBUTARIA_FULL.md (1315 lineas).`;
  }
};
