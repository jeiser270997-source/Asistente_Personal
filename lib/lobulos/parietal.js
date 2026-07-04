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
      const isPsych = s.id.includes('psico') && (qLower.includes('estres') || qLower.includes('ansiedad') || qLower.includes('mal'));
      const isTutor = s.id.includes('tutor') && (qLower.includes('estudiar') || qLower.includes('aprender') || qLower.includes('cesde') || qLower.includes('sena'));
      const isFinanzas = s.id.includes('financiero') && (qLower.includes('dinero') || qLower.includes('comprar') || qLower.includes('gasto'));
      const isTrib = s.id.includes('tributaria') && (qLower.includes('dian') || qLower.includes('impuesto') || qLower.includes('renta'));
      return isPsych || isTutor || isFinanzas || isTrib;
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
