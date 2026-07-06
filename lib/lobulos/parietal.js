const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.agents', 'skills');

class LobuloParietal {
  constructor() {
    this.skills = [];
    this.loadSkills();
  }

  loadSkills() {
    this.skills = [];
    if (!fs.existsSync(SKILLS_DIR)) return;

    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, d.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf8');
          // Extraer nombre y descripción simples
          const nameMatch = content.match(/name:\s*(.+)/);
          const descMatch = content.match(/description:\s*(.+)/);
          this.skills.push({
            id: d.name,
            name: nameMatch ? nameMatch[1].trim() : d.name,
            description: descMatch ? descMatch[1].trim() : '',
            content: content
          });
        }
      }
    }
  }

  // Enrutar al skill más adecuado basado en la petición
  // En una arquitectura más avanzada usaríamos un LLM ligero para enrutar,
  // pero aquí usamos keywords o coincidencia simple para velocidad extrema.
  routeSkill(query) {
    const qLower = query.toLowerCase();
    
    // Sistema básico de enrutamiento
    const matches = this.skills.filter(s => {
      const isPsych = (s.id.includes('psico') || s.id === 'modo_diario') &&
        (qLower.includes('estres') || qLower.includes('ansiedad') || qLower.includes('mal') ||
         qLower.includes('diario') || qLower.includes('hablar') || qLower.includes('desahog'));
      const isTutor = (s.id.includes('tutor') || s.id === 'qa_bootcamp') &&
        (qLower.includes('estudiar') || qLower.includes('aprender') || qLower.includes('cesde') ||
         qLower.includes('sena') || qLower.includes('playwright') || qLower.includes('testing') ||
         qLower.includes('bootcamp') || qLower.includes('qa') || qLower.includes('ejercicio'));
      const isFinanzas = (s.id.includes('financiero') || s.id === 'finanzas_didi') &&
        (qLower.includes('dinero') || qLower.includes('comprar') || qLower.includes('gasto') ||
         qLower.includes('didi') || qLower.includes('ahorro') || qLower.includes('deuda') ||
         qLower.includes('presupuesto') || qLower.includes('ingreso'));
      const isTrib = s.id.includes('tributaria') &&
        (qLower.includes('dian') || qLower.includes('impuesto') || qLower.includes('renta'));
      const isJob = s.id === 'job_hunter' &&
        (qLower.includes('trabajo') || qLower.includes('empleo') || qLower.includes('cv') ||
         qLower.includes('entrevista') || qLower.includes('oferta') || qLower.includes('computrabajo') ||
         qLower.includes('linkedin') || qLower.includes('aplicar'));
      const isKarp = s.id === 'karpathy_guidelines' &&
        (qLower.includes('codigo') || qLower.includes('refactor') || qLower.includes('implementar') ||
         qLower.includes('arquitectura') || qLower.includes('simplif'));
      return isPsych || isTutor || isFinanzas || isTrib || isJob || isKarp;
    });

    if (matches.length > 0) {
      return matches.map(m => `=== SKILL CARGADO: ${m.name} ===\n${m.content}`).join('\n\n');
    }

    // Por defecto, cargar el cerebro
    const cerebro = this.skills.find(s => s.id === 'cerebro');
    return cerebro ? `=== SKILL DEFAULT: ${cerebro.name} ===\n${cerebro.content}` : '';
  }
}

module.exports = new LobuloParietal();
