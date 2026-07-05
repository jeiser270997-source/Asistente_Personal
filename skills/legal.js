const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

module.exports = {
  id: 'legal',
  nombre: 'Legal Colombia',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const legal = vital.legal_financiero || {};

    let simitCtx = '';
    try {
      const simit = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'simit_multas.json'), 'utf8'));
      simitCtx = `\n[PLACA KEW496] 3 multas SIMIT | Deuda total: $${(simit.total_deuda/1000).toFixed(0)}K`;
      for (const m of simit.multas) {
        const icono = m.estado === 'Cobro coactivo' ? '🔴' : m.fecha_resolucion > '2026-06-01' ? '🟡' : '🟠';
        simitCtx += `\n  ${icono} ${m.id}: ${m.secretaria} | ${m.infraccion} | ${m.estado} | $${(m.total/1000).toFixed(0)}K`;
      }
    } catch {}

    return `[SKILL: Legal Colombia]
- SIMIT: ${legal.simit?.estado || '3 multas pendientes, 1 en cobro coactivo'}
- Ultima gestion SIMIT: ${legal.simit?.ultima_gestion || 'FCM remitio por competencia a Itagui (04/07/2026)'}
- Fiscalia: Ampliacion Denuncia NUC 110016102838202604358 (21 May 2026)
- Temas activos: comparendos SIMIT, cobro coactivo Itagui, denuncia fiscalia${simitCtx}`;
  }
};
