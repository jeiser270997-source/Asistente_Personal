/**
 * Critic
 * Segundo agente independiente que revisa el plan de CV antes de ejecutarlo.
 * Busca inconsistencias, exageraciones, problemas ATS y omisiones.
 *
 * Personalidad: escéptico, meticuloso, centrado en credibilidad.
 * Independiente del Generator (otro prompt, otro rol).
 *
 * Input:  TailoringPlan, JobPosting, CandidateProfile, GapReport
 * Output: CriticReview
 */

/**
 * @typedef {Object} CriticReview
 * @property {'approved'|'changes_requested'|'rejected'} verdict
 * @property {Object[]} issues - Problemas encontrados
 * @property {'inconsistency'|'exaggeration'|'ats_problem'|'omission'|'accuracy'} issues.type
 * @property {string} issues.section - Sección afectada
 * @property {string} issues.description
 * @property {string} issues.suggestion - Cómo corregirlo
 * @property {Object[]} strengths - Aciertos del plan
 * @property {string} strengths.section
 * @property {string} strengths.reason
 * @property {number} confidence - 0-100, qué tan seguro está el crítico
 */

const CONTRACT = {
  input: 'TailoringPlan, JobPosting, CandidateProfile, GapReport',
  output: 'CriticReview',
  methods: [
    {
      name: 'review(plan, job, profile, gap)',
      returns: 'CriticReview',
      description: 'Revisa el plan de CV y emite un veredicto',
    },
    {
      name: 'isApproved(review)',
      returns: 'boolean',
      description: 'True si el plan puede ejecutarse',
    },
    {
      name: 'iterate(plan, review, job, profile, gap)',
      returns: 'TailoringPlan',
      description: 'Aplica las correcciones sugeridas y genera nueva versión',
    },
  ],
  maxIterations: 3,
};

module.exports = { CONTRACT };
