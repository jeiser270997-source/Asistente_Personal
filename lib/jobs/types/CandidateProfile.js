/**
 * @typedef {Object} CandidateProfile
 * Perfil del candidato construido desde data/user/ y masterledger.
 * @property {string} name
 * @property {string[]} skills - Lista de skills técnicas
 * @property {string} [seniority] - Nivel de seniority
 * @property {string[]} [languages] - Idiomas con nivel
 * @property {Object[]} [experience] - Experiencia laboral
 * @property {string} experience.title
 * @property {string} experience.company
 * @property {string} [experience.startDate]
 * @property {string} [experience.endDate]
 * @property {string[]} [education] - Educación
 * @property {string[]} [certifications]
 * @property {Object} [preferences] - Preferencias laborales
 * @property {number} [preferences.salaryMin] - Salario mínimo aceptable
 * @property {string[]} [preferences.modalities] - Modalidades aceptadas
 * @property {string[]} [preferences.targetCompanies] - Empresas objetivo
 * @property {string[]} [preferences.targetRoles] - Roles objetivo
 * @property {string[]} [preferences.excludeCompanies] - Empresas a evitar
 * @property {string} [preferences.location] - Ubicación preferida
 */

module.exports = {};
