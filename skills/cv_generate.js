/**
 * skills/cv_generate.js
 *
 * Skill: Genera CV adaptado por oferta.
 *
 * Trigger: job.match.ready
 * Input: { titulo, empresa, lugar, score, url }
 * Output: job.cv.ready
 *
 * Sin LLM, genera un CV baseline con ajustes por keywords.
 */
const fs = require('fs');
const path = require('path');
const { decide } = require('../lib/ai/decision');
const bus = require('../lib/event_bus');

const CV_OUT_DIR = path.resolve(__dirname, '..', 'data', 'jobs', 'cv_tailored');

function generarCVBaseline(job) {
  const texto = `${job.titulo || ''} ${job.descripcion || ''}`.toLowerCase();

  const skillsDestacar = [];
  if (texto.includes('playwright')) skillsDestacar.push('Playwright');
  if (texto.includes('javascript') || texto.includes('js')) skillsDestacar.push('JavaScript');
  if (texto.includes('node')) skillsDestacar.push('Node.js');
  if (texto.includes('sql') || texto.includes('base de datos')) skillsDestacar.push('SQL');
  if (texto.includes('git')) skillsDestacar.push('Git / GitHub Actions');
  if (texto.includes('api') || texto.includes('postman')) skillsDestacar.push('API Testing / Postman');
  if (texto.includes('python')) skillsDestacar.push('Python');
  if (texto.includes('docker')) skillsDestacar.push('Docker');
  if (texto.includes('ci/cd') || texto.includes('github actions')) skillsDestacar.push('CI/CD');

  const resumen = skillsDestacar.length > 0
    ? `QA Automation Junior con experiencia en ${skillsDestacar.slice(0, 3).join(', ')}${skillsDestacar.length > 3 ? ' y mas' : ''}. Proyecto LifeOS en produccion con 12 workflows automatizados.`
    : 'QA Automation Junior con experiencia en Playwright, JavaScript y automatizacion de procesos. Proyecto LifeOS en produccion.';

  return {
    resumen,
    skills_destacar: skillsDestacar,
    secciones: ['Resumen profesional', 'Proyecto destacado: LifeOS', 'Experiencia', 'Educacion', 'Habilidades tecnicas'],
  };
}

module.exports = {
  name: 'cv_generate',
  description: 'Genera CV adaptado a cada oferta',
  trigger: 'job.match.ready',
  input: ['titulo', 'empresa'],
  version: '1.0.0',

  async run({ payload }) {
    const job = payload;

    if (!fs.existsSync(CV_OUT_DIR)) fs.mkdirSync(CV_OUT_DIR, { recursive: true });

    const cv = generarCVBaseline(job);
    const slug = job.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40);
    const filename = `cv_${slug}_${Date.now()}.md`;
    const filepath = path.join(CV_OUT_DIR, filename);

    const content = [
      `# CV - ${job.titulo} en ${job.empresa || 'empresa'}`,
      '',
      `> ${cv.resumen}`,
      '',
      '## Resumen Profesional',
      '',
      cv.resumen,
      '',
      '## Habilidades Clave',
      '',
      ...cv.skills_destacar.map(s => `- ${s}`),
      '',
      '## Proyecto Destacado: LifeOS',
      '',
      'Sistema autonomo de automatizacion personal con 12 workflows en GitHub Actions,',
      'scraping con Playwright, integracion con APIs (DeepSeek, Gmail, Telegram),',
      'y base de datos SQLite con WAL. Arquitectura event-driven con bus de eventos propio.',
      '',
      '## Educacion',
      '',
      '- Bootcamp QA Automation (28 semanas) - CESDE, 2026',
      '- Bases de Datos y Excel - SENA, 2026',
      '- Analisis y Desarrollo de Software (en curso) - CESDE',
      '',
      '## Experiencia',
      '',
      '- **QA Automation** - Proyecto LifeOS (2025-presente)',
      '  Automatizacion E2E con Playwright, CI/CD con GitHub Actions, scraping, APIs.',
      '- **Vigilante CCTV** - Coovisocial (2019-2021)',
      '- **Agente N1** - Sitel / Iberia (2021)',
      '',
      '## Contacto',
      '',
      '- jeiser270997@gmail.com',
      '- +57 304 461 5613',
      '- Medellin, Colombia',
    ].join('\n');

    fs.writeFileSync(filepath, content, 'utf8');

    bus.emit('job.cv.ready', {
      ...job,
      cv_path: filepath,
      skills_destacar: cv.skills_destacar,
    }, { source: 'skill.cv_generate', priority: 'normal' });

    return {
      event: 'job.cv.generated',
      payload: { titulo: job.titulo, empresa: job.empresa, cv_path: filepath },
    };
  },
};
