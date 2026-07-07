/**
 * ATS Reviewer — 100% determinístico
 *
 * Revisa el CV contra reglas de sistemas de tracking.
 * Sin IA. Solo formato, keywords, estructura.
 *
 * Output: ATSReview { score, issues[], warnings[], passed }
 */

function review(cvText, job) {
  const issues = [];
  const warnings = [];

  // Longitud
  const lines = cvText.split('\n').filter(l => l.trim());
  if (lines.length > 60) issues.push({ type: 'too_long', severity: 'alta', detail: `${lines.length} líneas, máximo 60` });
  else if (lines.length > 50) warnings.push({ type: 'long', detail: `${lines.length} líneas, ideal <50` });

  // Palabras clave de la oferta
  const keywords = _extractKeywords(job);
  const missing = keywords.filter(k => !cvText.toLowerCase().includes(k.toLowerCase()));
  if (missing.length > 3) {
    issues.push({ type: 'missing_keywords', severity: 'alta', detail: `${missing.length} keywords ausentes`, keywords: missing });
  } else if (missing.length > 0) {
    warnings.push({ type: 'few_missing_keywords', detail: `${missing.length} keywords ausentes`, keywords: missing });
  }

  // Secciones obligatorias
  const sections = { experiencia: /experiencia|trayectoria|historial/i, educacion: /educación|educacion|formación|formacion|estudio/i, skills: /habilidades|skills|competencias|tecnologías|tecnologias/i };
  const missingSections = [];
  for (const [name, regex] of Object.entries(sections)) {
    if (!regex.test(cvText)) missingSections.push(name);
  }
  if (missingSections.length > 0) {
    issues.push({ type: 'missing_sections', severity: 'alta', detail: `Faltan: ${missingSections.join(', ')}` });
  }

  // Tablas (ATS las lee mal)
  if (/\|.*\|.*\|/.test(cvText)) warnings.push({ type: 'tables_detected', detail: 'Posibles tablas, algunos ATS no las leen bien' });

  // Contacto
  if (!/\b[\w.-]+@[\w.-]+\.\w+\b/.test(cvText)) issues.push({ type: 'missing_email', severity: 'media', detail: 'No se detecta email' });

  const score = _calculateScore(issues, warnings);
  const passed = score >= 70;

  const result = { reviewer: 'ats', score, passed, issues, warnings };
  return result;
}

function _extractKeywords(job) {
  const words = new Set();
  if (job.requirements) job.requirements.forEach(r => r.split(/\s+/).forEach(w => { if (w.length > 3) words.add(w); }));
  if (job.title) job.title.split(/\s+/).forEach(w => { if (w.length > 3) words.add(w); });
  return [...words].slice(0, 15);
}

function _calculateScore(issues, warnings) {
  let score = 100;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 8 : 5;
  score -= warnings.length * 3;
  return Math.max(0, score);
}

module.exports = { review };
