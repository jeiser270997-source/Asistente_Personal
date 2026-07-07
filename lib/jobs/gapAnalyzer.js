/**
 * GapAnalyzer — Cuantitativo
 *
 * Compara una oferta contra el perfil y produce:
 *   - Cobertura % por categoría
 *   - Skills matching detallado (✅⚠️❌)
 *   - Impacto estimado de cerrar cada brecha
 *   - ROI de aprendizaje por skill faltante
 *
 * No genera texto libre. Solo datos.
 */

let bus;
try { bus = require('../events/event_bus'); } catch { bus = null; }

/**
 * @param {Object} job     - JobPosting normalizado
 * @param {Object} profile - CandidateProfile
 * @returns {Object} gapReport
 */
function analyze(job, profile) {
  const skills = _analyzeSkills(job.requirements || [], profile.skills || []);
  const experience = _analyzeExperience(job, profile);
  const coverage = _calculateCoverage(skills, experience);

  const result = {
    jobTitle: job.title,
    company: job.company,
    coverage,
    skills,
    experience,
    learningROI: _calculateLearningROI(skills, job.requirements || []),
    summary: `${coverage.overall}% cobertura — ${skills.matched}/${skills.total} skills.`,
  };

  if (bus) { try {
    bus.emit('job.gap_analyzed', {
      jobId: job.sourceId || job.url,
      coverage: coverage.overall,
      missingSkills: skills.details.filter(s => s.status === 'missing').map(s => s.name),
    }, { source: 'gapAnalyzer', priority: 'low' });
  } catch (_) {} }

  return result;
}

function _analyzeSkills(requirements, profileSkills) {
  const profileLower = profileSkills.map(s => s.toLowerCase());
  const details = requirements.map(req => {
    const rl = req.toLowerCase();
    const match = profileLower.some(ps => ps.includes(rl) || rl.includes(ps));
    const partial = !match && profileLower.some(ps => {
      const words = rl.split(/\s+/);
      return words.some(w => w.length > 3 && ps.includes(w));
    });
    return {
      name: req,
      status: match ? 'matched' : partial ? 'partial' : 'missing',
      inProfile: match || partial,
    };
  });

  return {
    total: details.length,
    matched: details.filter(d => d.status === 'matched').length,
    partial: details.filter(d => d.status === 'partial').length,
    missing: details.filter(d => d.status === 'missing').length,
    coverage: Math.round((details.filter(d => d.inProfile).length / details.length) * 100),
    details,
  };
}

function _analyzeExperience(job, profile) {
  const issues = [];
  // Sin datos de experiencia aún
  return {
    yearsMatch: null,
    issues,
    coverage: 100,
  };
}

function _calculateCoverage(skills, experience) {
  const overall = Math.round((skills.coverage + experience.coverage) / 2);
  return { overall, skills: skills.coverage, experience: experience.coverage };
}

function _calculateLearningROI(skills, requirements) {
  // Por cada skill faltante, estima:
  // - frecuencia en el mercado (proxy: requisitos similares)
  // - cuanto subiría el score si la aprendiera
  // - tiempo estimado de aprendizaje
  const missing = skills.details.filter(s => s.status === 'missing');
  return missing.map(skill => {
    const difficulty = _estimateDifficulty(skill.name);
    const scoreImpact = _estimateScoreImpact(skill.name, requirements.length);
    const marketDemand = _estimateMarketDemand(skill.name);
    return {
      skill: skill.name,
      status: 'missing',
      scoreImpact: `${scoreImpact} pts`,
      difficulty,
      estimatedHours: difficulty === 'baja' ? 20 : difficulty === 'media' ? 60 : 120,
      marketDemand,
      roi: marketDemand === 'alta' && difficulty !== 'alta' ? 'alto' : 'bajo',
      recommendation: _recommendation(marketDemand, difficulty, scoreImpact),
    };
  });
}

function _estimateDifficulty(skill) {
  const name = skill.toLowerCase();
  if (/docker|kubernetes|aws|azure|ci\/cd|terraform/i.test(name)) return 'media';
  if (/rust|machine learning|deep learning|ia|blockchain/i.test(name)) return 'alta';
  if (/python|javascript|typescript|sql|git|api|selenium|playwright|cypress/i.test(name)) return 'baja';
  return 'media';
}

function _estimateScoreImpact(skill, totalRequirements) {
  return Math.round((1 / Math.max(totalRequirements, 1)) * 100);
}

function _estimateMarketDemand(skill) {
  const name = skill.toLowerCase();
  if (/docker|kubernetes|aws|python|react|node|sql|git|api|playwright|selenium|ci\/cd/i.test(name)) return 'alta';
  if (/(java|c#|.net|php|angular|typescript|azure|devops)/i.test(name)) return 'alta';
  return 'media';
}

function _recommendation(demand, difficulty, impact) {
  if (demand === 'alta' && difficulty !== 'alta') return 'prioritario';
  if (demand === 'alta') return 'recomendado';
  if (impact > 15) return 'recomendado';
  return 'opcional';
}

module.exports = { analyze };
