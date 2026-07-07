/**
 * CVStrategy
 * Define cómo adaptar el CV para esta oferta específica basado en el gap.
 * No genera el CV, solo dice qué cambiar, qué enfatizar y qué omitir.
 *
 * Input:  JobPosting, CandidateProfile, GapReport
 * Output: TailoringPlan
 */

/**
 * @typedef {Object} TailoringPlan
 * @property {Object[]} sections - Secciones del CV a modificar
 * @property {string} sections.name - Nombre de la sección
 * @property {'add'|'remove'|'reorder'|'rewrite'} sections.action
 * @property {string} sections.content - Nuevo contenido
 * @property {string} sections.reason - Por qué este cambio
 * @property {Object[]} highlights - Experiencias a destacar
 * @property {string} highlights.experience - Descripción
 * @property {string} highlights.reason - Por qué destacarla
 * @property {string} summaryTitle - Título de resumen para el CV
 * @property {string[]} keywords - Palabras clave de la oferta a incluir
 * @property {string} [coverLetterAngle] - Ángulo para la carta de presentación
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile, GapReport',
  output: 'TailoringPlan',
  methods: [
    {
      name: 'createPlan(job, profile, gap)',
      returns: 'TailoringPlan',
      description: 'Crea un plan de adaptación de CV para la oferta',
    },
    {
      name: 'prioritizeHighlights(plan)',
      returns: 'TailoringPlan',
      description: 'Reordena secciones según relevancia para la oferta',
    },
  ],
};

module.exports = { CONTRACT };
