require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const https = require('https');
const { chromium } = require('playwright');

async function getToken() {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('https://betowa.sena.edu.co/iniciar-sesion', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1000);
  await p.locator('button[aria-haspopup=listbox]').first().click();
  await p.waitForTimeout(300);
  await p.click('button[role=option]:has-text("Cédula de Ciudadanía")');
  await p.fill('input[name=documentNumber]', '1019156838');
  await p.fill('input[name=password]', process.env.BETOWA_PASS || process.env.SENA_MOODLE_PASS);
  await p.click('button:has-text("Iniciar sesión")');
  await p.waitForTimeout(5000);
  const token = await p.evaluate(() => localStorage.getItem('auth_token'));
  await b.close();
  return token;
}

function apiGet(token, programId) {
  return new Promise((resolve) => {
    const url = new URL('https://betowa.sena.edu.co/api/courses');
    url.searchParams.set('programId', programId);
    const opts = {
      hostname: 'betowa.sena.edu.co',
      path: url.pathname + url.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'parse_error' }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

(async () => {
  console.log('Getting fresh token...');
  const token = await getToken();
  if (!token) { console.log('Login failed'); return; }

  // Load all courses
  const fs = require('fs');
  const path = require('path');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'betowa_courses.json')));
  const allCourses = data.techCourses || data.allCourses;
  const techIds = [...new Set(techProgramIds(allCourses))];

  console.log(`Scanning ${techIds.length} tech programIds for open courses...`);

  const openCourses = [];
  const stateCounts = {};

  for (let i = 0; i < techIds.length; i++) {
    const pid = techIds[i];
    const name = allCourses.find(c => c.programId === pid)?.name || '';
    const result = await apiGet(token, pid);
    const courses = result.courses || [];

    for (const c of courses) {
      const s = c.course_state;
      stateCounts[s] = (stateCounts[s] || 0) + 1;
      if (s === 1 || s === 2) {
        openCourses.push({ programId: pid, name: name.slice(0, 60), ...c });
      }
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${techIds.length} | states: ${JSON.stringify(stateCounts)} | open found: ${openCourses.length}`);
    }
  }

  console.log(`\n=== STATE DISTRIBUTION ===`);
  Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).forEach(([s, count]) => {
    console.log(`  state ${s}: ${count} courses`);
  });

  console.log(`\n=== OPEN COURSES (state=1 or 2): ${openCourses.length} ===`);
  openCourses.forEach(c => {
    console.log(`  programId=${c.programId} | ${c.name} | ficha=${c.id} | ${c.start_date}..${c.end_date} | ${c.city} | ${c.site}`);
  });

  fs.writeFileSync('data/betowa_scan_result.json', JSON.stringify({ openCourses, stateCounts, scanned: techIds.length }, null, 2));

  function techProgramIds(courses) {
    const keywords = [
      'programacion', 'desarrollo', 'software', 'javascript', 'python', 'java', 'web',
      'base de datos', 'sql', 'redes', 'ciberseguridad', 'inteligencia artificial',
      'datos', 'analisis de datos', 'cloud', 'nube', 'devops', 'git', 'linux',
      'automatizacion', 'pruebas', 'testing', 'qa', 'excel', 'power bi',
      'tics', 'tic', 'tecnologia', 'algoritmo', 'logica de programacion',
      'informatica', 'sistema', 'marketing digital', 'contenidos digitales',
      'ciudadania digital', 'competencias digitales', 'habilidades digitales',
      'ofimatica', 'aplicaciones', 'multimedia', 'fotografia digital',
      'electronica', 'circuitos', 'datos', 'docker', 'contenedores',
      'node.js', 'mongodb', 'nosql', 'mysql', 'php', 'c++', 'poo',
      'gemelo digital', 'industria 4.0', 'storytelling',
      'community management', 'analitica web', 'e-commerce', 'ecommerce',
    ];
    const ids = [];
    for (const c of courses) {
      const name = (c.name || '').toLowerCase();
      if (keywords.some(k => name.includes(k))) {
        ids.push(c.programId);
      }
    }
    return ids;
  }
})();
