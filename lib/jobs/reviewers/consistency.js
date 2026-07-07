/**
 * Consistency Reviewer — 100% determinístico
 *
 * Verifica coherencia interna del CV:
 *   - Fechas cronológicas
 *   - Skills repetidas
 *   - Cargos duplicados
 *   - Skills en experiencia vs skills declaradas
 *
 * Sin IA. Solo reglas.
 */

function review(cvText, job) {
  const issues = [];

  // Detectar contradicción seniority vs años
  const years = _extractYears(cvText);
  const seniority = _detectSeniorityClaim(cvText);
  if (seniority && years < 2 && /senior|lead|principal/i.test(seniority)) {
    issues.push({ type: 'seniority_mismatch', severity: 'media', detail: `Se declara ${seniority} con ~${years} años de experiencia` });
  }

  // Skills que aparecen en experiencia pero no en skills declaradas
  const declaredSkills = _extractDeclaredSkills(cvText);
  const skillsInExperience = _extractSkillsFromExperience(cvText);
  const undeclared = skillsInExperience.filter(s => !declaredSkills.some(d => d.includes(s) || s.includes(d)));
  if (undeclared.length > 3) {
    issues.push({ type: 'undeclared_skills', severity: 'leve', detail: `${undeclared.length} skills en experiencia no declaradas en skills`, skills: undeclared.slice(0, 5) });
  }

  // Cargos duplicados
  const titles = _extractTitles(cvText);
  const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (dupes.length > 0) {
    issues.push({ type: 'duplicate_titles', severity: 'leve', detail: `Cargos repetidos: ${[...new Set(dupes)].join(', ')}` });
  }

  const score = _calculateScore(issues);
  const passed = score >= 80;

  return { reviewer: 'consistency', score, passed, issues };
}

function _extractYears(text) {
  // Estimación simple por rango de fechas
  const dates = text.match(/\b(20\d{2})\b/g);
  if (!dates || dates.length < 2) return 0;
  const nums = dates.map(Number).sort();
  return Math.max(1, nums[nums.length - 1] - nums[0]);
}

function _detectSeniorityClaim(text) {
  const match = text.match(/\b(junior|semisenior|semi.senior|senior|lead|principal)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function _extractDeclaredSkills(text) {
  // Busca sección de skills
  const section = text.match(/(?:skills|habilidades|competencias|tecnologías)[\s\S]{1,500}/i);
  if (!section) return [];
  return section[0].split(/\n/).map(l => l.replace(/^[•\-*\d.\s]+/, '').trim()).filter(l => l.length > 1 && l.length < 40);
}

function _extractSkillsFromExperience(text) {
  const techs = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'git',
    'docker', 'aws', 'azure', 'playwright', 'selenium', 'cypress', 'api', 'mongodb',
    'postgresql', 'mysql', 'linux', 'kubernetes', 'ci/cd', 'jenkins', 'github actions'];
  return techs.filter(t => text.toLowerCase().includes(t));
}

function _extractTitles(text) {
  const lines = text.split('\n').filter(l => l.trim());
  // Busca líneas que parezcan cargos
  return lines.filter(l => /\b(engineer|analyst|developer|lead|manager|coordinator|assistant|specialist|tester|qa)\b/i.test(l))
    .map(l => l.trim().substring(0, 60));
}

function _calculateScore(issues) {
  let score = 100;
  for (const i of issues) score -= i.severity === 'alta' ? 15 : i.severity === 'media' ? 10 : 5;
  return Math.max(0, score);
}

module.exports = { review };
