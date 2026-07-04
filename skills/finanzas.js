const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'finanzas',
  nombre: 'Finanzas Personales',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const legal = vital.legal_financiero || {};
    return `[SKILL: Finanzas Personales]
- Bancos: ${(legal.bancos || []).join(', ') || 'sin registrar'}
- Deudas: ${(legal.deudas || []).join(', ') || 'sin registrar'}
- Obligaciones mensuales: ${(legal.obligaciones_mensuales || []).join(', ') || 'sin registrar'}
- Recordar: fecha de corte de tarjetas, pago de servicios EPM, recargas nequi/daviplata`;
  }
};
