require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();

  // Listen to network requests
  const apiCalls = [];
  p.on('response', resp => {
    if (resp.url().includes('/api/')) {
      apiCalls.push({ url: resp.url(), method: resp.request().method(), status: resp.status() });
    }
  });

  // Login
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

  // Go to course page
  console.log('Visiting course page...');
  await p.goto('https://betowa.sena.edu.co/oferta/desarrollo-backend-con-node-js-y-mongodb?programId=186534&modality=V', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(3000);

  // Try clicking "Inscribirme"
  const btn = p.locator('button:has-text("Inscribirme")');
  const btnExists = await btn.count();
  console.log(`"Inscribirme" buttons found: ${btnExists}`);

  if (btnExists > 0) {
    await btn.first().click();
    await p.waitForTimeout(5000);
    console.log('\nAPI calls made after click:');
    apiCalls.forEach(c => console.log(`  ${c.method} ${c.url} => ${c.status}`));

    // Check response
    const pageText = await p.evaluate(() => document.body.innerText);
    console.log('\nPage text after click:', pageText.slice(0, 2000));
  }

  // Also try to get my current enrolled courses from profile page
  console.log('\n\n=== Checking profile/enrolled courses ===');
  const profilePage = await ctx.newPage();
  await profilePage.goto('https://betowa.sena.edu.co/perfil', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await profilePage.waitForTimeout(3000);
  const perfilText = await profilePage.evaluate(() => document.body.innerText);
  console.log(perfilText.slice(0, 2000));

  await b.close();
})();
