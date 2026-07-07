/**
 * @typedef {Object} JobPosting
 * Propiedad: fuente de la oferta (computrabajo, linkedin, indeed, correo, etc)
 * @property {string} source
 * @property {string} sourceId - ID único en la fuente original
 * @property {string} title - Cargo
 * @property {string} company - Nombre de la empresa
 * @property {string} [location] - Ubicación
 * @property {'remoto'|'hibrido'|'presencial'} [modality]
 * @property {number} [salaryMin] - Salario mínimo ofrecido
 * @property {number} [salaryMax] - Salario máximo ofrecido
 * @property {string} [currency] - COP, USD
 * @property {string} description - Descripción completa de la oferta
 * @property {string[]} requirements - Lista de requisitos
 * @property {string[]} [niceToHave] - Requisitos deseables
 * @property {string[]} [responsibilities] - Responsabilidades
 * @property {string[]} [benefits] - Beneficios
 * @property {'indefinido'|'fijo'|'temporal'|'freelance'} [contractType]
 * @property {'full-time'|'part-time'|'por-temporada'} [employmentType]
 * @property {string} [industry] - Sector industrial
 * @property {string} [experienceLevel] - Nivel de experiencia requerido
 * @property {boolean} [requiresEnglish] - Requiere inglés
 * @property {string} [englishLevel] - Nivel de inglés requerido
 * @property {string} url - URL de la oferta original
 * @property {string} [companyUrl] - URL de la empresa
 * @property {string} [companyLogo] - URL del logo
 * @property {Date} postedAt - Fecha de publicación
 * @property {Date} fetchedAt - Fecha de obtención
 * @property {Object} [raw] - Datos crudos de la fuente original
 */

/**
 * @returns {JobPosting}
 */
function create(data) {
  return {
    source: data.source || 'unknown',
    sourceId: data.sourceId || '',
    title: data.title || '',
    company: data.company || '',
    location: data.location,
    modality: data.modality || 'presencial',
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    currency: data.currency || 'COP',
    description: data.description || '',
    requirements: data.requirements || [],
    niceToHave: data.niceToHave || [],
    responsibilities: data.responsibilities || [],
    benefits: data.benefits || [],
    contractType: data.contractType,
    employmentType: data.employmentType || 'full-time',
    industry: data.industry,
    experienceLevel: data.experienceLevel,
    requiresEnglish: data.requiresEnglish || false,
    englishLevel: data.englishLevel,
    url: data.url || '',
    companyUrl: data.companyUrl,
    companyLogo: data.companyLogo,
    postedAt: data.postedAt ? new Date(data.postedAt) : new Date(),
    fetchedAt: new Date(),
    raw: data.raw,
  };
}

module.exports = { create };
