/**
 * @typedef {Object} ScoreBreakdown
 * Desglose completo del score de una oferta.
 * Los pesos son configurables desde data/config/jobs/scoring_weights.json
 * @property {number} total - Score total 0-100
 * @property {number} skills - Coincidencia de skills técnicas
 * @property {number} seniority - Nivel de experiencia
 * @property {number} salary - Ajuste salarial
 * @property {number} location - Ubicación y modalidad
 * @property {number} english - Inglés
 * @property {number} company - Empresa objetivo o industria
 * @property {number} growth - Potencial de crecimiento
 * @property {number} llmAlignment - Evaluación del LLM (0-30% del total)
 * @property {string[]} strengths - Fortalezas detectadas
 * @property {string[]} weaknesses - Debilidades detectadas
 * @property {string[]} redFlags - Señales de alerta
 * @property {string} reasoning - Explicación en lenguaje natural
 */

/**
 * @returns {ScoreBreakdown}
 */
function createEmpty(jobTitle) {
  return {
    total: 0,
    skills: 0,
    seniority: 0,
    salary: 0,
    location: 0,
    english: 0,
    company: 0,
    growth: 0,
    llmAlignment: 0,
    strengths: [],
    weaknesses: [],
    redFlags: [],
    reasoning: `Score calculado para ${jobTitle || 'la oferta'}`,
  };
}

module.exports = { createEmpty };
