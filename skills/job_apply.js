/**
 * skills/job_apply.js
 *
 * Skill: Detectar postulaciones laborales desde correos.
 *
 * Trigger: email.processed
 * Input: { from, subject, body }
 * Output: job.applied | job.rejected
 *
 * Registra en ApplicationStore vía job_tracker.
 */
const jobTracker = require('../lib/runtime/job_tracker');

const PLATFORMAS = [
  { name: 'Computrabajo', from: 'computrabajo', subjects: ['postulaci', 'aplicado', 'solicitud'] },
  { name: 'LinkedIn', from: 'linkedin', subjects: ['application', 'solicitud', 'postulado', 'applied'] },
  { name: 'Indeed', from: 'indeed', subjects: ['application', 'solicitud'] },
];

module.exports = {
  name: 'job_apply',
  description: 'Detecta postulaciones desde correos y registra en ApplicationStore',
  trigger: 'email.processed',
  input: ['from', 'subject'],
  version: '1.0.0',

  run({ payload }) {
    const text = `${payload.from} ${payload.subject} ${payload.body || ''}`.toLowerCase();

    // Detectar plataforma
    const plat = PLATFORMAS.find(p =>
      text.includes(p.from) && p.subjects.some(s => text.includes(s))
    );
    if (!plat) return null;

    // Extraer empresa y cargo
    let empresa = '?';
    let cargo = '?';

    const cargoMatch = payload.subject.match(/(?:para|como|aplicado a|apply for)\s*(.+?)(?:en|$)/i);
    if (cargoMatch) cargo = cargoMatch[1].trim();

    const empresaMatch = (payload.body || '').match(/(?:empresa|compañia|company|en)\s*:?\s*([^\n]+)/i);
    if (empresaMatch) empresa = empresaMatch[1].trim();

    // Registrar via job_tracker
    const result = jobTracker.logApplication({
      empresa,
      cargo,
      plataforma: plat.name,
      detalles: payload.subject + '\n' + (payload.body || '').substring(0, 300),
    });

    if (!result.duplicado) {
      return {
        event: 'job.applied',
        payload: { empresa, cargo, plataforma: plat.name, score: result.evaluacion?.score },
        priority: 'normal',
      };
    }
    return null;
  },
};
