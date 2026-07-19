const f = require('node:fs').readFileSync('E:\\PROYECTOS\\Mis_Proyectos\\Asistente_Personal\\sofia_main.html', 'utf8');

// Find all links in the HTML
const allLinks = f.match(/href="[^"]*"/g) || [];
const urls = [...new Set(allLinks)].sort();
urls.forEach(u => console.log(u));

console.log('\n=== Links with matricula/matr ===');
urls.filter(u => u.toLowerCase().includes('matr')).forEach(u => console.log(u));

console.log('\n=== Links with convocatoria ===');
urls.filter(u => u.toLowerCase().includes('convoc')).forEach(u => console.log(u));

console.log('\n=== Links with inscripcion ===');
urls.filter(u => u.toLowerCase().includes('inscrip')).forEach(u => console.log(u));
