const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const htmlPath = 'file:///' + path.join(__dirname, 'temp_html.html').replace(/\\/g, '/');
  await page.goto(htmlPath);
  const pdfPath = path.join(require('os').homedir(), 'Desktop', 'Evidencia_AA3_Normalizacion_San_Jorge.pdf');
  await page.pdf({ 
      path: pdfPath, 
      format: 'A4', 
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      printBackground: true
  });
  console.log('PDF EXitosamente Generado en: ' + pdfPath);
  await browser.close();
})();
