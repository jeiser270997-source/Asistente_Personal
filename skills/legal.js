const CheckpointStore = require('../runtime/stores/CheckpointStore');
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
      const simit = CheckpointStore.get('simit_ultima_consulta');

      if (simit) {
        const multas = simit.detalle?.multas || [];
        const totalNumeric = parseFloat(String(simit.total || '0').replace(/[^\d]/g, '')) || 0;

        simitCtx = `\n[PLACA KEW496] ${multas.length} multas SIMIT | Deuda total: $${(totalNumeric/1000).toFixed(0)}K`;
        for (const m of multas) {
          const valorNumeric = parseFloat(String(m.valor || '0').replace(/[^\d]/g, '')) || 0;
          const icono = m.estado?.includes('coactivo') ? '🔴' : m.estado?.includes('Impugnado') ? '🟡' : '🟠';
          simitCtx += `\n  ${icono} ${m.id}: ${m.secretaria || 'N/A'} | ${m.infraccion || 'N/A'} | ${m.estado || 'N/A'} | $${(valorNumeric/1000).toFixed(0)}K`;
        }
      }
    } catch (e) {
      console.error('[Legal Skill] Error al cargar contexto de SQLite SIMIT:', e.message);
    }

    return `[SKILL: Legal Colombia]
- SIMIT: ${legal.simit?.estado || '3 multas pendientes, 1 en cobro coactivo'}
- Ultima gestion SIMIT: ${legal.simit?.ultima_gestion || 'FCM remitio por competencia a Itagui (04/07/2026)'}
- Fiscalia: Ampliacion Denuncia NUC 110016102838202604358 (21 May 2026)
- Temas activos: comparendos SIMIT, cobro coactivo Itagui, denuncia fiscalia${simitCtx}`;
  }
};
