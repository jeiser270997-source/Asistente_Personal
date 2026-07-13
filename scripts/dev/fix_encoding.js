const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// Diccionario de traducción utilizando secuencias de escape hexadecimales
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
  'cédula': 'cédula',
  'c\xc3\xa9dula': 'cédula'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let orig = content;

  // 1. Reemplazar mojibake
  for (const [bad, good] of Object.entries(map)) {
    content = content.split(bad).join(good);
  }

  // 2. Parche de Sintaxis GHA Token (Corregir $\{{ o \}})
  if (filePath.endsWith('.yml')) {
    content = content.split('$\{{').join('${{');
    content = content.split('\}}').join('}}');
    content = content.split('$\\{{').join('${{');
  }

  // 3. Corregir bug de ?? en process_juniorjobs.js
  if (filePath.endsWith('process_juniorjobs.js')) {
    content = content.replace(/\?\?\s*<b>/g, '🟢 <b>');
    content = content.replace(/\?\?\s*Guardadas/g, '💾 Guardadas');
  }

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Reparado: ${path.relative(ROOT, filePath)}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.next', 'backups', 'attachments'].includes(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.json', '.yml', '.yaml', '.md', '.ts'].includes(ext)) {
        fixFile(full);
      }
    }
  }
}

console.log("🛠️ Iniciando escaneo recursivo global...");
walk(ROOT);
console.log("🎉 ¡Handshake de codificación y sintaxis completado!");