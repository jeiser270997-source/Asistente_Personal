const fs = require('fs');

// Calificaciones
const cal = JSON.parse(fs.readFileSync('data/sena/calificaciones.json','utf8'));
console.log('=== CALIFICACIONES REALES ===');
console.log(JSON.stringify(cal, null, 2).substring(0, 2000));

// Deadlines
console.log('\n=== DEADLINES ===');
const dl = JSON.parse(fs.readFileSync('data/sena/deadlines.json','utf8'));
console.log(JSON.stringify(dl, null, 2));

// Alertas
console.log('\n=== ALERTAS_SENA.md ===');
console.log(fs.readFileSync('data/contexto_maestro/ALERTAS_SENA.md','utf8'));
