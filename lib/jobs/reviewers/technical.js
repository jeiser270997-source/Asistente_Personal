/**
 * Technical Reviewer — Híbrido
 *
 * 90% determinístico: skills match, profundidad, relevancia.
 * 10% LLM (solo si confidence < 0.7): alineación técnica real.
 */

function review(cvText, job) {
  const issues = [];

  // Skills match ponderado por nivel
  const reqSkills = job.requirements || [];
  const matched = [];
  const missing = [];

  for (const req of reqSkills) {
    const rl = req.toLowerCase();
    const found = _findSkillDepth(cvText, rl);
    if (found.found) matched.push({ skill: req, depth: found.depth });
    else missing.push({ skill: req });
  }

  const coverage = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 100;

  // Seniority match
  const cvSeniority = _detectSeniority(cvText);
  const jobSeniority = _normalizeSeniority(job.experienceLevel);
  if (cvSeniority && jobSeniority) {
    const diff = cvSeniority.level - jobSeniority.level;
    if (diff < -1) issues.push({ type: 'underqualified', severity: 'alta', detail: `CV muestra ${cvSeniority.name}, oferta pide ${job.experienceLevel}` });
    else if (diff > 1) issues.push({ type: 'overqualified', severity: 'leve', detail: `CV muestra ${cvSeniority.name}, oferta pide ${job.experienceLevel}` });
  }

  // Tecnologías mencionadas sin profundidad
  const shallowTechs = matched.filter(m => m.depth === 'mencion');
  if (shallowTechs.length > 2) issues.push({ type: 'shallow_skills', severity: 'leve', detail: `${shallowTechs.length} skills solo mencionadas sin contexto` });

  const score = _calculateScore(coverage, issues);
  const needsLLM = score < 70 || issues.length > 2;

  return {
    reviewer: 'technical',
    score,
    passed: score >= 65,
    coverage,
    matched,
    missing,
    issues,
    needsLLM,
  };
}

function _findSkillDepth(text, skill) {
  const regex = new RegExp(`.{0,100}${skill}.{0,100}`, 'gi');
  const match = regex.exec(text);
  if (!match) return { found: false, depth: null };

  const ctx = match[0].toLowerCase();
  if (/\b(\d+\s*años?|experto|avanzado|profundo|extensive|senior)\b/.test(ctx)) return { found: true, depth: 'profundo' };
  if (/\b(intermedio|medio|trabajé|usé|utilicé|implementé|desarrollé|creé)\b/.test(ctx)) return { found: true, depth: 'aplicado' };
  return { found: true, depth: 'mencion' };
}

function _detectSeniority(text) {
  const levels = [
    { name: 'junior', regex: /\b(junior|jr|trainee|practicante)\b/i, level: 1 },
    { name: 'semisenior', regex: /\b(semisenior|semi.senior|mid.level|intermediate)\b/i, level: 2 },
    { name: 'senior', regex: /\b(senior|sr\.?|lead|principal)\b/i, level: 3 },
  ];
  for (const l of levels) if (l.regex.test(text)) return l;
  return null;
}

function _normalizeSeniority(level) {
  if (!level) return null;
  const map = { junior: 1, jr: 1, semisenior: 2, 'semi-senior': 2, senior: 3, lead: 3, principal: 3 };
  return { name: level, level: map[level.toLowerCase()] || 2 };
}

function _calculateScore(coverage, issues) {
  let score = coverage;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 10 : 5;
  return Math.max(0, Math.min(100, score));
}

module.exports = { review };
