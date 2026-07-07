const fs = require('fs');
const path = require('path');

const BASE = 'E:/PROYECTOS/Asistente_Personal';

// Scripts in subdirectories of scripts/ need ../../lib/ instead of ../lib/
const subdirs = ['integrations', 'jobs', 'schedulers', 'diagnostics', 'maintenance', 'dev'];

let totalFiles = 0;
let totalChanges = 0;

for (const dir of subdirs) {
  const fullDir = path.join(BASE, 'scripts', dir);
  if (!fs.existsSync(fullDir)) continue;

  for (const file of fs.readdirSync(fullDir)) {
    if (!file.endsWith('.js')) continue;

    const filePath = path.join(fullDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace require('../lib/') with require('../../lib/')
    // These are paths from scripts/subdir/file.js up to project root then into lib/
    content = content.replace(/require\('\.\.\/lib\//g, "require('../../lib/");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFiles++;
      const changes = (original.match(/require\('\.\.\/lib\//g) || []).length;
      totalChanges += changes;
      console.log(dir + '/' + file + ': ' + changes + ' paths');
    }
  }
}

console.log('\nTotal: ' + totalFiles + ' archivos, ' + totalChanges + ' rutas actualizadas');
