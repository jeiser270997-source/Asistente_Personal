/**
 * FeedbackEngine
 * Consume eventos del ciclo de vida de las aplicaciones y ajusta los pesos del scorer.
 *
 * Eventos que consume:
 *   application.created
 *   application.viewed
 *   application.rejected
 *   application.interview
 *   application.technical_test
 *   application.offer
 *   application.accepted
 *   application.declined
 *   application.ghosted (sin respuesta después de N días)
 *
 * Aprendizaje:
 *   - Si ofertas con score alto son sistemáticamente rechazadas → ajustar pesos
 *   - Si ofertas con skills específicas generan entrevistas → ponderar más esas skills
 *   - Si una empresa siempre rechaza → reducir su peso en company
 *
 * Input:  ApplicationEvent
 * Output: void (modifica scoring_weights.json)
 */

/**
 * @typedef {Object} ApplicationEvent
 * @property {string} applicationId
 * @property {string} jobId
 * @property {string} company
 * @property {'applied'|'viewed'|'rejected'|'interview'|'technical_test'|'offer'|'accepted'|'declined'|'ghosted'} status
 * @property {number} score - Score con el que se aplicó
 * @property {ScoreBreakdown} scoreBreakdown
 * @property {Date} timestamp
 * @property {Object} [metadata] - Datos adicionales (feedback, motivo rechazo)
 */

const CONTRACT = {
  input: 'ApplicationEvent',
  output: 'void (side effect: actualiza pesos)',
  methods: [
    {
      name: 'processEvent(event)',
      returns: 'void',
      description: 'Procesa un evento de aplicación y actualiza el modelo',
    },
    {
      name: 'getAdjustments()',
      returns: '{ weight: string, delta: number }[]',
      description: 'Retorna los ajustes de pesos pendientes de aplicar',
    },
    {
      name: 'applyAdjustments()',
      returns: 'boolean',
      description: 'Persiste los ajustes en scoring_weights.json',
    },
    {
      name: 'getStats()',
      returns: '{ applied, interviews, offers, conversionRate }',
      description: 'Estadísticas agregadas de rendimiento',
    },
  ],
};

module.exports = { CONTRACT };
