const fs = require('fs');
const path = require('path');

const BASE = 'E:/PROYECTOS/Asistente_Personal';
const LIB = path.join(BASE, 'lib');

// Files and their incorrect require patterns (from -> to)
const fixes = {
  'ai/llm_service.js': [
    ["require('./scheduling/", "require('../scheduling/"],
  ],
  'events/event_registry.js': [
    ["require('./events/event_bus')", "require('./event_bus')"],
    ["require('./integrations/telegram')", "require('../integrations/telegram')"],
  ],
  'integrations/calendar_client.js': [
    ["require('./integrations/google_auth')", "require('./google_auth')"],
  ],
  'integrations/telegram.js': [
    ["require('./context/pending')", "require('../context/pending')"],
    ["require('./ai/llm_service')", "require('../ai/llm_service')"],
  ],
  'scheduling/scheduler.js': [
    ["require('./events/event_bus')", "require('../events/event_bus')"],
  ],
  'skills/skill_engine.js': [
    ["require('./events/event_bus')", "require('../events/event_bus')"],
  ],
  'think/think.js': [
    ["require('./context/state_snapshot')", "require('../context/state_snapshot')"],
    ["require('./events/event_bus')", "require('../events/event_bus')"],
    ["require('./ai/decision')", "require('../ai/decision')"],
  ],
  'memory/mem0_client.js': [
    ["require('./memory/memory_engine')", "require('./memory_engine')"],
  ],
};

let totalFiles = 0;
let totalChanges = 0;

for (const [file, fileFixes] of Object.entries(fixes)) {
  const filePath = path.join(LIB, file);
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found): ' + file);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let fileChanged = false;

  for (const [oldStr, newStr] of fileFixes) {
    const newContent = content.split(oldStr).join(newStr);
    if (newContent !== content) {
      const count = (content.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      content = newContent;
      fileChanged = true;
      totalChanges += count;
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFiles++;
    console.log('FIXED: ' + file);
  }
}

console.log('\nTotal: ' + totalFiles + ' archivos, ' + totalChanges + ' rutas');
