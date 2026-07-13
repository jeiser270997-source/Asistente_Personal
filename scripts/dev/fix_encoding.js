const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const map = {
  '\xe2\x9c\x85': '\u2705', // ✅
  '\xf0\x9f\x8f\xa2': '\xf0\x9f\x8f\xa2', // 🏢
  '\xf0\x9f\x93\x8d': '\xf0\x9f\x93\x8d', // 📍
  '\xf0\x9f\x8e\xaf': '\xf0\x9f\x8e\xaf', // 🎯
  '\xf0\x9f\x92\xac': '\xf0\x9f\x92\xac', // 💬
  '\xf0\x9f\x9a\x80': '\xf0\x9f\x9a\x80', // 🚀
  '\xe2\x9a\xa0': '\u26a0\ufe0f', // ⚠️
  '\xf0\x9f\x97\x91': '\xf0\x9f\x97\x91', // 🗑️
  '\xf0\x9f\x93\xa9': '\xf0\x9f\x93\xa9', // 📥
  '\xf0\x9f\x93\x96': '\xf0\x9f\x93\x96', // 📖
  '\xf0\x9f\x8f\x93': '\xf0\x9f\x8f\x93', // 🏓
  '\xe2\x9b\x94': '\u26d4', // ⛔
  '\xf0\x9f\xa4\x96': '\xf0\x9f\xa4\x96', // 🤖
  '\xf0\x9f\x92\xa5': '\xf0\x9f\x92\xa5', // 💥
  '\xf0\x9f\x93\x8b': '\xf0\x9f\x93\x8b', // 📋
  '\xf0\x9f\x94\xa7': '\xf0\x9f\x94\xa7', // 🔧
  '\xf0\x9f\x9f\xa2': '\xf0\x9f\x9f\xa2', // 🟢
  '\xf0\x9f\x9f\xa1': '\xf0\x9f\x9f\xa1', // 🟡
  '\xf0\x9f\x94\xb4': '\xf0\x9f\x94\xb4', // 🔴
  '\xe2\xac\x9b': '\u2b1b', // ⬛
  '\xf0\x9f\x92\xbc': '\xf0\x9f\x92\xbc', // 💼
  '\xf0\x9f\x94\x97': '\xf0\x9f\x94\x97', // 🔗
  'Medell\xc3\xadn': 'Medellín',
  'Medell\xc3\xad': 'Medellín',
  'Bogot\xc3\xa1': 'Bogotá',
  'itagu\xc3\xad': 'Itagüí',
  '\xc3\xa9xito': 'éxito',
  'postulaci\xc3\xb3n': 'postulación',
  'delizaci\xc3\xb3n': 'delización',
  'Iniciaci\xc3\xb3n': 'Iniciación',
  'Televisi\xc3\xb3n': 'Televisión',
  'resoluci\xc3\xb3n': 'resolución',
  'notificaci\xc3\xb3n': 'notificación',
  'citaci\xc3\xb3n': 'citación',
  'formaci\xc3\xb3n': 'formación',
  'comunicaci\xc3\xb3n': 'comunicación',
  'reuni\xc3\xb3n': 'reunión',
  'sue\xc3\xb1o': 'sueño',
  'S\xc3\xa1bado': 'Sábado',
  'Mi\xc3\xa9rcoles': 'Miércoles',
  'f\xc3\xadsica': 'física',
  'excluy\xc3\xa9ndolo': 'excluyéndolo',
  'imposici\xc3\xb3n': 'imposición',
  'Se\xc3\xb1ores': 'Señores',
  'cedula': 'cédula',
  'c\xc3\xa9dula': 'cédula'
};

const files = [
  'lib/integrations/telegram.js',
  'scripts/schedulers/brain_orchestrator.js',
  'scripts/integrations/moodle_sena_scraper.js',
  'scripts/integrations/moodle_sena_tracker.js',
  'scripts/integrations/simit_scraper.js',
  'scripts/jobs/computrabajo_scraper.js',
  'scripts/jobs/process_juniorjobs.js',
  'lib/runtime/job_tracker.js'
];

for (const f of files) {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) continue;

  let content = fs.readFileSync(fp, 'utf8');
  let orig = content;

  // Reemplazar mojibake
  for (const [bad, good] of Object.entries(map)) {
    content = content.split(bad).join(good);
  }

  // Corregir bug de ?? en process_juniorjobs.js
  if (f === 'scripts/jobs/process_juniorjobs.js') {
    content = content.replace(/\?\?\s*<b>/g, '\u00f0\u009f\u009f\u00a2 <b>');
    content = content.replace(/\?\?\s*Guardadas/g, '💾 Guardadas');
  }

  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`✅ Codificación reparada en: ${f}`);
  }
}

console.log("🎉 ¡Handshake de codificación completo! Emojis y acentos restaurados.");