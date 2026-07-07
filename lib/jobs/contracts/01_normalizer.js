/**
 * Normalizer
 * Convierte ofertas de cualquier fuente (Computrabajo, LinkedIn, Indeed, correo)
 * al formato estandarizado JobPosting.
 *
 * Input:  raw data desde scraper/parser
 * Output: JobPosting normalizado
 *
 * Cada fuente implementa su propio normalizer.
 * El NormalizerRouter selecciona el correcto según job.source.
 */

const CONTRACT = {
  input: 'raw:Object (datos crudos del portal)',
  output: 'JobPosting',
  methods: [
    {
      name: 'normalize(raw)',
      returns: 'JobPosting',
      description: 'Normaliza una oferta cruda al formato estándar',
    },
    {
      name: 'normalizeBatch(rawList)',
      returns: 'JobPosting[]',
      description: 'Normaliza múltiples ofertas en lote',
    },
    {
      name: 'supports(source)',
      returns: 'boolean',
      description: 'Indica si este normalizer soporta la fuente indicada',
    },
  ],
  errors: ['UNSUPPORTED_SOURCE', 'MALFORMED_INPUT', 'MISSING_REQUIRED_FIELDS'],
};

module.exports = { CONTRACT };
