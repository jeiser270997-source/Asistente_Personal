const fs = require('fs');
const path = require('path');

const BASE = 'E:/PROYECTOS/Asistente_Personal';
const LIB = path.join(BASE, 'lib');

// Files that need '../runtime/' -> '../../runtime/' (two levels deep)
const deepFiles = [
  'context/state_snapshot.js',
  'events/event_bus.js',
  'events/event_registry.js',
  'scheduling/scheduler.js',
  'think/think.js',
];

// Files that need '../runtime/' -> '../../runtime/' (already in lib/runtime/, needs to go up two levels)
const runtimeFiles = [
  'runtime/job_tracker.js',
  'runtime/resume_engine.js',
];

let totalFiles = 0;
let totalChanges = 0;

for (const file of deepFiles.concat(runtimeFiles)) {
  const filePath = path.join(LIB, file);
  if (!fs.existsSync(filePath)) { console.log('SKIP: ' + file); continue; }

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let fileChanged = false;

  const count = (content.match(/require\('\.\.\/runtime\//g) || []).length;
  if (count > 0) {
    content = content.replace(/require\('\.\.\/runtime\//g, "require('../../runtime/");
    fileChanged = true;
    totalChanges += count;
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFiles++;
    console.log('FIXED: ' + file + ' (' + count + ' paths)');
  }
}

console.log('\nTotal: ' + totalFiles + ' archivos, ' + totalChanges + ' rutas');
