const CheckpointStore = require('../runtime/stores/CheckpointStore');

module.exports = {
  id: 'transito',
  nombre: 'Transito Colombia - Defensa Legal',
  getContext() {
    let simitCtx = '';
    try {
      const simit = CheckpointStore.get('simit_ultima_consulta');

      if (simit) {
        const multas = simit.detalle?.multas || [];
        const totalNumeric = parseFloat(String(simit.total || '0').replace(/[^\d]/g, '')) || 0;

        simitCtx = `\n[TRANSITO_JEISER] Placa KEW496 (Toyota Corolla 2010) | Deuda activa: $${(totalNumeric/1000).toFixed(0)}K | SOAT vence 31/12/2026 | RTM vence 26/12/2026`;
        for (const m of multas) {
          const valorNumeric = parseFloat(String(m.valor || '0').replace(/[^\d]/g, '')) || 0;
          const icono = m.estado?.includes('Impugnado') ? '🟡' : m.estado?.includes('Pagad') ? '✅' : '⬜';
          simitCtx += `\n  ${icono} ${m.id}: ${m.secretaria || 'N/A'} | ${m.infraccion || 'N/A'} | ${m.estado || 'N/A'} | $${(valorNumeric/1000).toFixed(0)}K`;
        }
      }
      simitCtx += '\n⚠ BXU28C (moto): SOAT VENCIDO 07/07/2025 + RTM VENCIDO 13/07/2025. NO CIRCULAR sin renovar. Multa C02: ~$950K + inmovilizacion.';
    } catch (e) {
      console.error('[Transito Skill] Error al cargar contexto de SQLite SIMIT:', e.message);
    }

    return `[SKILL: Transito Colombia - Defensa Legal v1.0]
Jeiser es conductor Didi. Alta exposicion a retenes, fotomultas, comparendos.
- Ley 1843/2017: fotomultas requieren notificacion fisica en 3 dias + DEI calibrado + senal SR-48
- Derecho a grabar retenes. No pueden retener celular. Identificacion del agente es obligatoria.
- Didi: zona gris legal. Decir "llevo un amigo/familiar". No mencionar la app.
- Multa C29 (velocidad): impugnable si no hay notificacion fisica o DEI sin calibracion.
- Plazos: 10 dias habiles para recurso de reposicion, 3 años para prescripcion.
- Amnistias: cada alcaldia tiene las suyas. Verificar portales locales.${simitCtx}`;
  }
};
