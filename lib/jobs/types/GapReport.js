/**
 * @typedef {Object} GapReport
 * @property {string[]} missingSkills - Skills que pide la oferta y no están en el perfil
 * @property {string[]} matchedSkills - Skills que coinciden
 * @property {string[]} exceededSkills - Skills del perfil que no pide la oferta
 * @property {Object[]} experienceGaps - Brechas de experiencia
 * @property {'experience'|'education'|'certification'|'language'} experienceGaps.type
 * @property {string} experienceGaps.description
 * @property {'critico'|'moderado'|'leve'} experienceGaps.severity
 * @property {string} experienceGaps.mitigation - Cómo cubrirlo
 * @property {Object[]} strengthsToHighlight - Experiencias que más aportan
 * @property {'cover'|'highlight'} strengthsToHighlight.action
 * @property {string} strengthsToHighlight.reason
 * @property {number} coverage - Porcentaje de cobertura 0-100
 * @property {string} summary - Resumen ejecutivo del gap
 */

module.exports = {};
