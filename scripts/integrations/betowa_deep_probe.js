require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const https = require('https');

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();

  // Login
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

  // Check my inscriptions/mis-cursos
  console.log('=== Checking /mis-cursos ===');
  await p.goto('https://betowa.sena.edu.co/mis-cursos', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(3000);
  const body = await p.evaluate(() => document.body.innerText);
  console.log(body.slice(0, 3000));

  // Check enrollment API
  console.log('\n=== Probing enrollment endpoints ===');
  const endpoints = ['/api/inscriptions', '/api/enrollments', '/api/enrollment', '/api/matriculate', '/api/courses/enroll'];
  for (const ep of endpoints) {
    const result = await new Promise((resolve) => {
      const url = new URL(`https://betowa.sena.edu.co${ep}`);
      const opts = {
        hostname: 'betowa.sena.edu.co',
        path: url.pathname,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, data: data.slice(0, 300) }));
      });
      req.on('error', e => resolve({ error: e.message }));
      req.end();
    });
    console.log(`  ${ep} => status=${result.status} data=${result.data?.slice(0, 100)}`);
  }

  // Check a course detail page  
  console.log('\n=== Visiting course page for programId=186534 ===');
  await p.goto('https://betowa.sena.edu.co/oferta/desarrollo-backend-con-node-js-y-mongodb?programId=186534&modality=V', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(3000);
  const pageText = await p.evaluate(() => document.body.innerText);
  console.log(pageText.slice(0, 3000));

  // Check all non-tech programs for different states
  console.log('\n=== Checking non-tech course states ===');
  const fs = require('fs');
  const path = require('path');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'betowa_courses.json')));
  const nonTech = data.allCourses.filter(c => !data.techCourses.includes(c));

  // Sample 20 non-tech programs
  let foundOpen = 0;
  for (let i = 0; i < Math.min(30, nonTech.length); i++) {
    const pid = nonTech[i].programId;
    const result = await new Promise((resolve) => {
      const url = new URL('https://betowa.sena.edu.co/api/courses');
      url.searchParams.set('programId', pid);
      const opts = {
        hostname: 'betowa.sena.edu.co',
        path: url.pathname + url.search,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ courses: [] }); }
        });
      });
      req.on('error', () => resolve({ courses: [] }));
      req.end();
    });
    const states = [...new Set((result.courses || []).map(c => c.course_state))];
    if (states.includes(1) || states.includes(2)) foundOpen++;
    console.log(`  programId=${pid} | ${nonTech[i].name.slice(0, 40)} | states=${JSON.stringify(states)}`);
  }
  console.log(`\nOpen found in non-tech sample: ${foundOpen}`);

  await b.close();
})();
