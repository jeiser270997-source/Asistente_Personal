/**
 * scripts/jobs/build_cv_from_md.js
 * Convierte cv_base.md a PDF usando Playwright (renderiza como HTML estilizado).
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { chromium } = require('playwright');
const fs   = require('node:fs');
const path = require('node:path');

const MD_PATH  = path.resolve(__dirname, '../../data/sources/jobs/cv_base.md');
const PDF_PATH = path.resolve(__dirname, '../../data/jobs/CV_Jeiser_Gutierrez_QA_Automation.pdf');

function mdToHtml(md) {
  return md
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p class="job-title">$1</p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul>${m}</ul>`)
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^\[(.+?)\]\((.+?)\)/gm, '<a href="$2">$1</a>');
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 10.5pt; color: #1a1a2e; line-height: 1.5; padding: 28px 36px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20pt; font-weight: 700; color: #0f3460; border-bottom: 2px solid #0f3460; padding-bottom: 6px; margin-bottom: 4px; }
  h2 { font-size: 11.5pt; font-weight: 700; color: #0f3460; border-bottom: 1px solid #dee2e6; padding-bottom: 3px; margin: 14px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  h3 { font-size: 10.5pt; font-weight: 600; margin: 8px 0 2px; color: #1a1a2e; }
  p { margin: 3px 0; }
  .job-title { font-weight: 600; margin-top: 10px; margin-bottom: 1px; }
  ul { margin: 4px 0 4px 16px; }
  li { margin: 2px 0; font-size: 10pt; }
  hr { border: none; border-top: 1px solid #dee2e6; margin: 10px 0; }
  em { color: #495057; font-style: normal; font-size: 9.5pt; }
  strong { font-weight: 600; }
  a { color: #0f3460; text-decoration: none; }
  @page { margin: 1.5cm; size: A4; }
`;

async function buildPDF() {
  const md  = fs.readFileSync(MD_PATH, 'utf-8');
  const body = mdToHtml(md);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.pdf({ path: PDF_PATH, format: 'A4', printBackground: true, margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' } });
  await browser.close();

  const size = (fs.statSync(PDF_PATH).size / 1024).toFixed(1);
  console.log(`✅ PDF generado: ${PDF_PATH} (${size} KB)`);
}

buildPDF().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
