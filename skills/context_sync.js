/**
 * skills/context_sync.js
 *
 * Skill: Sincroniza contexto desde eventos del bus al CaseStore.
 *
 * Trigger: email.important
 * Input: { from, subject, summary }
 * Output: case.created
 */
const CaseStore = require('../runtime/stores/CaseStore');

const CATEGORIAS = [
  { keywords: ['dian', 'muisca', 'requerimiento'], tipo: 'gobierno', label: 'DIAN' },
  { keywords: ['simit', 'comparendo', 'multa', 'transito'], tipo: 'legal', label: 'SIMIT' },
  { keywords: ['entrevista', 'reclutador', 'proceso seleccion'], tipo: 'empleo', label: 'Proceso seleccion' },
  { keywords: ['sena', 'moodle', 'curso', 'tarea', 'actividad'], tipo: 'estudio', label: 'SENA' },
  { keywords: ['factura', 'recibo', 'pago', 'vencimiento'], tipo: 'finanzas', label: 'Factura' },
  { keywords: ['cesde', 'bootcamp', 'clase', 'taller'], tipo: 'estudio', label: 'CESDE' },
];

module.exports = {
  name: 'context_sync',
  description: 'Sincroniza correos importantes al CaseStore',
  trigger: 'email.important',
  input: ['from', 'subject'],
  version: '1.0.0',

  run({ payload }) {
    const text = `${payload.from} ${payload.subject}`.toLowerCase();

    for (const cat of CATEGORIAS) {
      if (cat.keywords.some(k => text.includes(k))) {
        // Check if case already exists
        const existentes = CaseStore.getAll(cat.tipo);
        const exists = existentes.find(c =>
          c.titulo?.toLowerCase().includes(cat.label.toLowerCase()) &&
          c.estado !== 'cerrado'
        );

        if (!exists) {
          const caseId = CaseStore.create({
            tipo: cat.tipo,
            estado: 'abierto',
            titulo: `${cat.label}: ${payload.subject.substring(0, 80)}`,
            descripcion: payload.summary || payload.subject,
            data: { fuente: 'email', from: payload.from },
            prioridad: cat.tipo === 'legal' || cat.tipo === 'gobierno' ? 0 : 1,
          });

          return {
            event: 'case.created',
            payload: { id: caseId, tipo: cat.tipo, titulo: `${cat.label}: ${payload.subject.substring(0, 80)}`, estado: 'abierto' },
            priority: 'normal',
          };
        }
        return null;
      }
    }
    return null;
  },
};
