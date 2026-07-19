require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const http = require('https');

const TOKEN = process.env.BETOWA_TOKEN || process.env.SENA_MOODLE_TOKEN;

const KEY_PROGRAM_IDS = [
  [186534, 'DESARROLLO BACKEND CON NODE.JS Y MONGODB'],
  [186934, 'ALGORITMO K-MEANS CON PYTHON'],
  [186935, 'ANALISIS EXPLORATORIO DE DATOS EN PYTHON'],
  [186936, 'LIMPIEZA Y TRANSFORMACION DE DATOS CON PYTHON'],
  [228386, 'GENERACION DE CODIGOS DE SOFTWARE CON IA'],
  [228347, 'GESTION DE DATOS EN MODELOS DE IA'],
  [228345, 'GESTION DEL RIESGO DE CIBERSEGURIDAD'],
  [178575, 'DESPLIEGUE EN CONTENEDORES DOCKER'],
  [154374, 'CONSTRUCCION DE BASES DE DATOS CON MYSQL'],
  [166014, 'PROGRAMACION DE APLICACIONES PARA MOVILES'],
  [165934, 'PROGRAMACION DE APLICACIONES Y SERVICIOS PARA LA NUBE'],
  [151338, 'PROGRAMACION DE SOFTWARE'],
  [178454, 'IMPLEMENTACION DE BASES DE DATOS NOSQL'],
  [103412, 'MANEJO DE PRUEBAS DE SOFTWARE'],
  [171614, 'PROCESAMIENTO DE PRUEBAS DE SOFTWARE'],
  [2523, 'APLICACION DE LA CALIDAD DEL SOFTWARE'],
  [170154, 'FUNDAMENTOS DE PROGRAMACION'],
  [152935, 'VARIABLES Y ESTRUCTURAS DE CONTROL EN PYTHON'],
  [229025, 'EXCEL AVANZADO'],
  [229523, 'IMPLEMENTACION DE SERVICIOS DE COMPUTACION EN LA NUBE'],
  [226470, 'MITIGACION Y PREVENCION DE AMENAZAS EN CIBERSEGURIDAD'],
  [203497, 'TRATAMIENTO DE RIESGOS DE CIBERSEGURIDAD MIPYMES'],
  [230705, 'RESILIENCIA CIBERNETICA'],
  [228723, 'PLANEACION DE CONTENIDOS DIGITALES CON STORYTELLING'],
  [155939, 'MARKETING DIGITAL'],
  [226510, 'APLICACION DE IA EN INTEGRACION DE DATOS'],
  [230705, 'FORMULACION DE ESTRATEGIAS DE RESILIENCIA CIBERNETICA'],
  [229107, 'IMPLEMENTACION DE HERRAMIENTAS DE IA'],
  [227158, 'TRANSFORMACION DE DATOS EN MODELOS DE IA'],
  [228723, 'PLANEACION DE CONTENIDOS DIGITALES'],
  [186534, 'DESARROLLO BACKEND CON NODE.JS Y MONGODB'],
];

function apiGet(programId) {
  return new Promise((resolve) => {
    const url = new URL('https://betowa.sena.edu.co/api/courses');
    url.searchParams.set('programId', programId);
    const opts = {
      hostname: 'betowa.sena.edu.co',
      path: url.pathname + url.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'parse_error', raw: data.slice(0, 200) }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

(async () => {
  const results = [];
  const seen = new Set();

  for (const [pid, name] of KEY_PROGRAM_IDS) {
    if (seen.has(pid)) continue;
    seen.add(pid);

    const data = await apiGet(pid);
    const courses = data.courses || [];
    const openCourses = courses.filter(c => c.course_state === 1 || c.course_state === 2);

    results.push({
      programId: pid,
      name,
      totalCourses: courses.length,
      openCourses: openCourses.length,
      states: [...new Set(courses.map(c => c.course_state))],
      courses: courses.map(c => ({
        id: c.id,
        state: c.course_state,
        start: c.start_date,
        end: c.end_date,
        site: c.site,
        city: c.city,
        shift: c.shift
      }))
    });

    const openInfo = openCourses.length > 0 ? `OPEN=${openCourses.length}` : 'CLOSED';
    console.log(`programId=${pid} | ${name.slice(0, 50)} | fichas=${courses.length} ${openInfo} states=[${[...new Set(courses.map(c=>c.course_state))]}]`);
  }

  console.log('\n=== ONLY OPEN COURSES ===');
  results.filter(r => r.openCourses > 0).forEach(r => {
    console.log(`\nprogramId=${r.programId} | ${r.name}`);
    r.courses.filter(c => c.state === 1 || c.state === 2).forEach(c => {
      console.log(`  Ficha=${c.id} | ${c.start}..${c.end} | ${c.site} | ${c.city} | ${c.shift}`);
    });
  });

  // Also check the /api/inscriptions endpoint
  console.log('\n=== Checking /api/inscriptions ===');
  const opts = {
    hostname: 'betowa.sena.edu.co',
    path: '/api/inscriptions',
    method: 'GET',
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
  };
  const req = http.request(opts, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Body: ${data.slice(0, 1000)}`);
    });
  });
  req.on('error', e => console.log(`Error: ${e.message}`));
  req.end();
})();
