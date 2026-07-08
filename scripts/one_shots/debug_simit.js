const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PLACA = 'KEW496';
const SIMIT_URL = 'https://www.fcm.org.co/simit/#/estado-cuenta';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navegando a SIMIT...');
  await page.goto(SIMIT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const input = await page.$('#txtBusqueda');
  if (input) {
    await input.fill(PLACA);
    const searchBtn = await page.$('#btnNumDocPlaca');
    if (searchBtn) await searchBtn.click();
    
    // Wait for the table to appear
    await page.waitForTimeout(5000);
    
    // Check if there's a "ver más" or pagination
    console.log('Tomando screenshot...');
    await page.screenshot({ path: path.join(__dirname, 'simit_debug.png'), fullPage: true });
    
    // Extract raw text of the table
    const html = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.map(t => t.outerHTML).join('\n\n');
    });
    fs.writeFileSync(path.join(__dirname, 'simit_tables.html'), html);
    console.log('HTML guardado.');
  } else {
    console.log('No se encontro el input');
  }
  
  await browser.close();
}

main().catch(console.error);
