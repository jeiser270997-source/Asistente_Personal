const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '..');

const MD_PATH = 'C:\\Users\\dev\\Documents\\SKILLS\\SKILL_TRIBUTARIA.md';

function getMDPreview() {
  try {
    const content = fs.readFileSync(MD_PATH, 'utf8');
    const lines = content.split('\n');
    return lines.slice(0, 15).join('\n');
  } catch {
    return null;
  }
}

module.exports = {
  id: 'tributaria',
  nombre: 'Tributaria Colombia (desde SKILL_TRIBUTARIA.md v5.4)',
  getContext() {
    const vital = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'contexto_vital.json'), 'utf8'));
    const dian = vital.legal_financiero?.dian || {};
    const md = getMDPreview();
    const mdNote = md ? `\n- Fuente: SKILL_TRIBUTARIA.md (v5.4, defensa DIAN, Art. 26 ET)` : '';
    return `[SKILL: Tributaria Colombia - Defensa DIAN]
- DIAN: ${dian.estado || 'sin informacion'}
- Ultima gestion: ${dian.ultima_gestion || 'ninguna'}
- Doctrina: Art. 26 ET (tesis nuclear), nulidad, prescripcion, firmeza
- Checklist pre-litigio: firma digital, fee, reforma 2025, sancion
- Terminos clave: 2-4 meses respuesta, 6 meses prescripcion sancion${mdNote}`;
  }
};
