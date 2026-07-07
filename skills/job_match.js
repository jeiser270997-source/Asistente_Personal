/**
 * skills/job_match.js
 *
 * Skill: Evalúa compatibilidad entre oferta y perfil.
 *
 * Trigger: job.detected (desde scraper o email)
 * Input: { titulo, empresa, lugar, descripcion, url }
 * Output: job.match.ready | null
 *
 * Usa el decision layer (LLM + fallback por scoring).
 * Sin LLM, usa scoring determinístico.
 */
const { decide } = require('../lib/ai/decision');
const bus = require('../lib/event_bus');

const UBICACIONES_OK = /medell[ií]n|antioquia|remoto|remote|virtual|home.?office|work.?from.?home|teletrabajo/i;
const UBICACIONES_NOK = /bogot[aá]|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|cucuta|ibagu[eé]|santa marta/i;

function scoreSinLLM(job) {
  const texto = `${job.titulo || ''} ${job.empresa || ''} ${job.lugar || ''} ${job.descripcion || ''}`.toLowerCase();
  let score = 50;

  // Skills match (basado en keywords)
  const keywords = {
    alta: ['playwright', 'javascript', 'node.js', 'nodejs', 'sql', 'git', 'github actions', 'qa', 'testing', 'automatizacion', 'selenium', 'api'],
    media: ['agil', 'scrum', 'postman', 'ci/cd', 'docker', 'linux', 'python', 'typescript'],
    baja: ['senior', 'lider', 'manager', '10 años', '8 años', '5 años'],
  };

  for (const kw of keywords.alta) { if (texto.includes(kw)) score += 4; }
  for (const kw of keywords.media) { if (texto.includes(kw)) score += 2; }
  for (const kw of keywords.baja) { if (texto.includes(kw)) score -= 8; }

  // Ubicación
  const lugar = `${job.lugar || ''} ${job.titulo || ''}`.toLowerCase();
  if (UBICACIONES_OK.test(lugar)) score += 10;
  else if (UBICACIONES_NOK.test(lugar)) score -= 15;

  // Modalidad
  if (texto.includes('remoto') || texto.includes('virtual') || texto.includes('home office')) score += 5;
  if (texto.includes('presencial') && !texto.includes('medell')) score -= 5;

  // Título del cargo
  if (/junior|trainee|practicante|sin experiencia|estudiante/i.test(texto)) score += 10;
  if (/analista|asistente|auxiliar|soporte/i.test(texto)) score += 5;

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  name: 'job_match',
  description: 'Evalua compatibilidad oferta/perfil con LLM + scoring',
  trigger: 'job.detected',
  input: ['titulo'],
  version: '1.0.0',

  async run({ payload }) {
    const job = payload;

    // Scoring sin LLM (rápido, siempre funciona)
    const score = scoreSinLLM(job);
    const compatible = score >= 60;

    const result = {
      score,
      compatible,
      razon: compatible ? 'Match basico superado' : 'Score bajo',
    };

    if (compatible) {
      bus.emit('job.match.ready', {
        ...job,
        score,
        razon: result.razon,
      }, { source: 'skill.job_match', priority: 'normal' });
    }

    return {
      event: 'job.matched',
      payload: { titulo: job.titulo, empresa: job.empresa, score, compatible },
      priority: 'normal',
    };
  },
};
