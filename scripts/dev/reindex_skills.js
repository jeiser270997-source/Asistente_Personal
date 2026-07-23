const fs = require('node:fs');
const path = require('node:path');

const AGENTS_SKILLS_DIR = path.join(__dirname, '..', '..', '.agents', 'skills');
const JS_SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const OUTPUT_INDEX_FILE = path.join(__dirname, '..', '..', 'skills', 'skills_index.json');

function parseSkillFrontmatter(content, defaultName) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let name = defaultName;
  let description = '';

  if (match) {
    const yaml = match[1];
    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    const descMatch = yaml.match(/^description:\s*(.+)$/m);
    if (nameMatch) name = nameMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
  }
  return { name, description };
}

function reindexSkills() {
  console.log('🔄 Reindexando skills de LifeOS...');
  const skillsMap = new Map();

  // 1. Scan .agents/skills/
  if (fs.existsSync(AGENTS_SKILLS_DIR)) {
    const entries = fs.readdirSync(AGENTS_SKILLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMd = path.join(AGENTS_SKILLS_DIR, entry.name, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          const content = fs.readFileSync(skillMd, 'utf8');
          const meta = parseSkillFrontmatter(content, entry.name);
          skillsMap.set(meta.name, {
            id: meta.name,
            name: meta.name,
            description: meta.description,
            type: 'agent_skill',
            path: `.agents/skills/${entry.name}/SKILL.md`
          });
        }
      }
    }
  }

  // 2. Scan skills/*.js
  if (fs.existsSync(JS_SKILLS_DIR)) {
    const files = fs.readdirSync(JS_SKILLS_DIR);
    for (const f of files) {
      if (f.endsWith('.js')) {
        const id = f.replace('.js', '');
        if (!skillsMap.has(id)) {
          skillsMap.set(id, {
            id: id,
            name: id,
            description: `Skill ejecutable JS ${f}`,
            type: 'executable_js',
            path: `skills/${f}`
          });
        }
      }
    }
  }

  const skillsList = Array.from(skillsMap.values());
  fs.writeFileSync(OUTPUT_INDEX_FILE, JSON.stringify(skillsList, null, 2), 'utf8');
  console.log(`✅ Indexado completado: ${skillsList.length} skills registrados en ${OUTPUT_INDEX_FILE}`);
}

reindexSkills();
