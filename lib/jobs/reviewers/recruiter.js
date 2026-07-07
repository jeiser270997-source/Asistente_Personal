/**
 * Recruiter Reviewer — LLM-only (semántico)
 *
 * Evalúa aspectos que solo un humano (o LLM) puede juzgar:
 *   - Narrativa y tono
 *   - Logros vs responsabilidades
 *   - Alineación con la oferta
 *   - Red flags
 *
 * Solo se ejecuta si los otros reviewers pasan.
 * Guarda tokens.
 */

function review(cvText, job) {
  // Placeholder: implementar llamada LLM aquí
  // Por ahora retorna neutral
  return {
    reviewer: 'recruiter',
    score: 75,
    passed: true,
    needsLLM: true,
    issues: [],
    note: 'Revisor LLM no implementado. Score neutral 75.',
  };
}

module.exports = { review };
