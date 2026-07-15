const fs = require('node:fs');
const { PATHS, DIR } = require('../lib/data/paths');
const path = require('node:path');

const CURRICULUM_PATH  = PATHS.BOOTCAMP_CURRICULUM;
const REPOS_PATH       = path.join(DIR.STATE, 'bootcamp', 'repos_mapping.json');
const SEGUIMIENTO_PATH = PATHS.BOOTCAMP_PROGRESS;

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

module.exports = {
  id: 'bootcamp_qa',
  nombre: 'Bootcamp QA Automation Engineer',
  prioridad: 10,
  keywords: [
    'bootcamp', 'estudiar', 'aprender', 'playwright', 'cypress', 'vitest',
    'testing', 'qa', 'automation', 'ejercicio', 'practica', 'tarea',
    'entregable', 'semana', 'fase', 'progreso', 'portfolio', 'entrevista',
    'cv', 'linkedin', 'trabajo', 'empleo', 'carrera', 'typescript',
    'javascript', 'fundamentos', 'mentoria', 'mentor', 'tutor'
  ],

  getContext() {
    const curriculum = loadJSON(CURRICULUM_PATH);
    const progreso = loadJSON(SEGUIMIENTO_PATH);
    const repos = loadJSON(REPOS_PATH);

    if (!curriculum) return '';

    const perfil = curriculum.prerrequisitos;
    let ctx = `[BOOTCAMP QA] Perfil: ${curriculum.perfil_objetivo} | ${curriculum.tiempo_estimado} | ${curriculum.horas_por_semana}\n`;
    ctx += `Fortalezas: ${perfil.fortalezas.join(', ')}\n`;
    ctx += `Debilidades: ${perfil.debilidades.join(', ')}\n\n`;

    if (progreso?.semana_actual) {
      const faseActual = curriculum.fases.find(f => {
        const [ini, fin] = f.semanas.split('-').map(Number);
        return progreso.semana_actual >= ini && progreso.semana_actual <= fin;
      });

      if (faseActual) {
        ctx += `FASE ACTUAL: ${faseActual.nombre}\n`;
        const mod = faseActual.modulos.find(m => m.semana === progreso.semana_actual);
        if (mod) {
          ctx += `SEMANA ${mod.semana}: ${mod.titulo}\n`;
          ctx += `Ejercicios pendientes:\n`;
          for (const ej of mod.ejercicios) {
            const done = progreso.completados?.includes(ej.substring(0, 40));
            ctx += `  [${done ? 'x' : ' '}] ${ej}\n`;
          }
          ctx += `Entregable: ${mod.entregable}\n`;
        }
      }
    } else {
      // Show summary of all phases
      ctx += 'FASES DEL BOOTCAMP:\n';
      for (const fase of curriculum.fases) {
        ctx += `  ${fase.id}: ${fase.nombre} (semanas ${fase.semanas})\n`;
      }
    }

    // Available repos
    if (repos?.categorias?.testing) {
      ctx += `\nREPOS DE ESTUDIO DISPONIBLES:\n`;
      ctx += `  Testing: ${repos.categorias.testing.join(', ')}\n`;
      ctx += `  TypeScript: ${(repos.categorias.typescript || []).join(', ')}\n`;
      ctx += `  Fundamentos: ${(repos.categorias.fundamentals || []).join(', ')}\n`;
      ctx += `  Proyectos: ${(repos.categorias.projects || []).join(', ')}\n`;
    }

    return ctx;
  }
};
