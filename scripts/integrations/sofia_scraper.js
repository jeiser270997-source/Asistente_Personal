require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const fs = require('node:fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: UA,
    locale: 'es-CO',
  });
  const p = await ctx.newPage();

  console.log('=== SOFIA Plus - Scrape Inscripciones ===\n');

  // Login
  await p.goto('http://senasofiaplus.edu.co/sofia-public/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(3000);
  const loginFrame = p.frames()[1];
  await loginFrame.selectOption('#tipoId', 'CC');
  if (!process.env.SENA_MOODLE_USER) throw new Error('Falta SENA_MOODLE_USER en .env');
  await loginFrame.fill('#username', process.env.SENA_MOODLE_USER);
  await loginFrame.fill('input[name="josso_password"]', process.env.SENA_MOODLE_PASS);
  await loginFrame.click('input[value="Ingresar"]');
  await p.waitForTimeout(5000);
  console.log('Logged in');

  // Switch to Aprendiz
  await p.evaluate(() => {
    const sel = document.getElementById('seleccionRol:roles');
    if (sel) { sel.value = '5'; sel.dispatchEvent(new Event('change', {bubbles: true})); }
  });
  await p.waitForTimeout(3000);

  // Navigate to Consultar Inscripción
  const targetUrl = 'http://senasofiaplus.edu.co/sofia/inscripcion/consultarinscripcion/consultarInscripcion.faces?menId=8&fwkmenu=si&conversationContext=1';
  console.log('Navigating to:', targetUrl);
  await p.goto(targetUrl, { waitUntil: 'load', timeout: 20000 });
  await p.waitForTimeout(3000);

  const pageText = await p.evaluate(() => document.body?.innerText || '');
  console.log('\nPage text (first 1500 chars):');
  console.log(pageText.slice(0, 1500));

  // Extract table data
  const tableData = await p.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const results = [];
    tables.forEach((table, ti) => {
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2) return;
      const headers = [];
      rows[0].querySelectorAll('th, td').forEach(cell => headers.push(cell.innerText.trim()));
      if (!headers.some(h => h.toLowerCase().includes('ficha') || h.toLowerCase().includes('programa') || h.toLowerCase().includes('formaci'))) return;
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length) {
          const row = {};
          headers.forEach((h, idx) => {
            row[h] = cells[idx]?.innerText?.trim() || '';
          });
          results.push(row);
        }
      }
    });
    return results;
  });

  if (tableData.length) {
    console.log(`\n=== ${tableData.length} cursos encontrados ===\n`);
    tableData.forEach((row, i) => {
      console.log(`${i + 1}. ${row['Identificador Ficha de Caracterización'] || row['Ficha'] || '(no id)'}`);
      console.log(`   Programa: ${row['Programa de Formación'] || ''}`);
      console.log(`   Estado: ${row['Estado'] || ''}`);
      console.log(`   Nivel: ${row['Nivel'] || ''}`);
      console.log(`   Regional: ${row['Regional'] || ''}`);
      console.log(`   Centro: ${row['Centro de Formación'] || ''}`);
      console.log(`   Municipio: ${row['Departamento / Municipio'] || ''}`);
      console.log(`   Modalidad: ${row['Modalidad de Formación'] || ''}`);
      console.log('');
    });

    // Save as JSON
    const outputPath = require('node:path').join(__dirname, '..', '..', 'data', 'sena_inscripciones.json');
    fs.mkdirSync(require('node:path').dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(tableData, null, 2));
    console.log(`Saved to: ${outputPath}`);
  } else {
    console.log('No table data found. Saving page HTML for analysis...');
    const html = await p.content();
    fs.writeFileSync('sofia_inscripcion_page.html', html);
    console.log('Saved HTML to sofia_inscripcion_page.html');
  }

  await p.screenshot({ path: 'sofia_inscripciones.png', fullPage: true });
  await b.close();
  console.log('\nDone');
})();
