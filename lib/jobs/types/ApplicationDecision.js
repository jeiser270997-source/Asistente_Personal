/**
 * @typedef {Object} ApplicationDecision
 * @property {'apply'|'skip'|'maybe'} action
 * @property {number} score - Score total que justifica la decisión
 * @property {number} scoreThreshold - Umbral mínimo configurado
 * @property {string} reasoning - Por qué se tomó esta decisión
 * @property {Object} [application] - Datos de la aplicación generada
 * @property {string} [application.cvPath] - Ruta del CV generado
 * @property {string} [application.coverLetter] - Carta de presentación
 * @property {string} [application.appliedAt] - Fecha de aplicación
 * @property {string[]} [highlights] - Puntos destacados del CV
 */

/**
 * @typedef {'applied'|'viewed'|'rejected'|'interview'|'technical_test'|'offer'|'accepted'|'declined'|'ghosted'} ApplicationStatus
 * Máquina de estados de una aplicación laboral.
 */

module.exports = {};
