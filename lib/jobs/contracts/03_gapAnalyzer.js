/**
 * GapAnalyzer
 * Compara la oferta contra el perfil para identificar brechas y fortalezas.
 * No genera CV, solo analiza qué falta y qué resaltar.
 *
 * Input:  JobPosting, CandidateProfile, ScoreBreakdown
 * Output: GapReport
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile, ScoreBreakdown',
  output: 'GapReport',
  methods: [
    {
      name: 'analyze(job, profile, score)',
      returns: 'GapReport',
      description: 'Analiza brechas entre el perfil y la oferta',
    },
    {
      name: 'getCoverage(gap)',
      returns: 'number',
      description: 'Porcentaje de cobertura 0-100',
    },
    {
      name: 'summarize(gap)',
      returns: 'string',
      description: 'Resumen ejecutivo de 2-3 líneas',
    },
  ],
};

module.exports = { CONTRACT };
