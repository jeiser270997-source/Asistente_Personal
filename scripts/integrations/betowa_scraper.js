require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');

const TECH_KEYWORDS = [
  'programacion', 'desarrollo', 'software', 'javascript', 'python', 'java', 'web',
  'base de datos', 'sql', 'redes', 'ciberseguridad', 'seguridad informatica',
  'inteligencia artificial', 'machine learning', 'datos', 'analisis de datos',
  'cloud', 'nube', 'devops', 'git', 'linux', 'sistema', 'informatica',
  'automatizacion', 'pruebas', 'testing', 'qa', 'ciudadania digital',
  'competencias digitales', 'ofimatica', 'excel', 'word', 'power bi',
  'tics', 'tic', 'tecnologia', 'aplicaciones', 'algoritmo', 'logica de programacion'
];

async function scrapePage(p, pageNum, modality) {
  const url = pageNum === 1
    ? `https://betowa.sena.edu.co/oferta?modality=${modality}`
    : `https://betowa.sena.edu.co/oferta?page=${pageNum}&modality=${modality}`;

  await p.goto(url, { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(2000);

  const courses = await p.evaluate(() => {
    const cards = document.querySelectorAll('a[href*="programId"]');
    return [...cards].map(a => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/programId=(\d+)/);
      const article = a.closest('article') || a;
      const text = article.innerText || '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      return {
        programId: match ? parseInt(match[1]) : null,
        name: lines[0] || '',
        details: lines.slice(1).join(' | '),
        href: href.split('?')[0]
      };
    }).filter(c => c.programId);
  });

  return courses;
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();

  console.log('Logging in...');
  await p.goto('https://betowa.sena.edu.co/iniciar-sesion', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1000);
  await p.locator('button[aria-haspopup=listbox]').first().click();
  await p.waitForTimeout(300);
  await p.click('button[role=option]:has-text("Cédula de Ciudadanía")');
  const userCC = process.env.USER_CC || process.env.SENA_MOODLE_USER;
  await p.fill('input[name=documentNumber]', userCC);
  await p.fill('input[name=password]', process.env.BETOWA_PASS || process.env.SENA_MOODLE_PASS);
  await p.click('button:has-text("Iniciar sesión")');
  await p.waitForTimeout(5000);

  const token = await p.evaluate(() => localStorage.getItem('auth_token'));
  if (!token) { console.log('Login failed'); await b.close(); return; }

  const allCourses = [];
  const totalPages = 51;
  const modality = 'V';

  for (let page = 1; page <= totalPages; page++) {
    const courses = await scrapePage(p, page, modality);
    allCourses.push(...courses);
    console.log(`Page ${page}/${totalPages}: ${courses.length} courses (total: ${allCourses.length})`);
  }

  console.log(`\n=== TOTAL: ${allCourses.length} courses ===`);

  // Filter by tech keywords
  const techCourses = allCourses.filter(c =>
    TECH_KEYWORDS.some(k => c.name.toLowerCase().includes(k))
  );

  console.log(`\n=== TECH COURSES: ${techCourses.length} ===`);
  techCourses.forEach(c => console.log(`  programId=${c.programId} | ${c.name}`));

  // Save to file
  const fs = require('fs');
  const path = require('path');
  const output = {
    fetchedAt: new Date().toISOString(),
    total: allCourses.length,
    tech: techCourses.length,
    allCourses,
    techCourses
  };
  const outPath = path.join(__dirname, '..', '..', 'data', 'betowa_courses.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${outPath}`);

  await b.close();
})();
