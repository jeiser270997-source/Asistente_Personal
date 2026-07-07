/**
 * Scorer
 * Evalúa una oferta normalizada contra el perfil del candidato.
 *
 * Input:  JobPosting, CandidateProfile
 * Output: ScoreBreakdown
 *
 * Composición:
 *   70% reglas determinísticas (skills, salario, modalidad, seniority, inglés, ubicación)
 *   30% evaluación LLM (alineación cultural, potencial de crecimiento, red flags)
 *
 * Los pesos se cargan desde data/config/jobs/scoring_weights.json
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile',
  output: 'ScoreBreakdown',
  methods: [
    {
      name: 'score(job, profile)',
      returns: 'ScoreBreakdown',
      description: 'Calcula el score completo de una oferta',
    },
    {
      name: 'scoreBatch(jobs, profile)',
      returns: 'ScoreBreakdown[]',
      description: 'Evalúa múltiples ofertas, ordenadas por score descendente',
    },
    {
      name: 'explain(score)',
      returns: 'string',
      description: 'Genera explicación legible del desglose',
    },
    {
      name: 'getThresholds()',
      returns: '{ apply: number, maybe: number }',
      description: 'Retorna los umbrales de decisión >= apply, >= maybe, < maybe',
    },
  ],
};

module.exports = { CONTRACT };
