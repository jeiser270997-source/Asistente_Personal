const fs = require('node:fs');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

const MAT_DIR = path.join(__dirname, '..', 'data', 'sena', 'materiales');

function log(msg) { console.log(msg); }

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n')
    .replace(/[ \t]{3,}/g, '  ')
    .trim();
}

function textToMarkdown(text, title) {
  const lines = text.split('\n');
  const processed = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { processed.push(''); continue; }

    if (trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{4,}$/) && trimmed.length < 80) {
      processed.push(`## ${trimmed}`);
    } else if (trimmed.match(/^(\d+[\.\)]\s+|CAPÍTULO|TEMA|UNIDAD|MÓDULO|Objetivo|Introducción|Conclusión|Resumen|Referencia|Bibliografía)\s/i)) {
      processed.push(`### ${trimmed}`);
    } else {
      processed.push(trimmed);
    }
  }

  return `# ${title}\n> Convertido de PDF | ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n\n${processed.join('\n\n')}`;
}

async function convertPdf(pdfPath) {
  try {
    const buffer = new Uint8Array(fs.readFileSync(pdfPath));
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    await parser.load();
    const result = await parser.getText();
    return cleanText(result.text || '');
  } catch (err) {
    return null;
  }
}

function collectPdfs(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'index.html') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPdfs(fullPath));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      results.push({ fullPath, name: entry.name, parentDir: path.dirname(fullPath) });
    }
  }
  return results;
}

async function main() {
  log('═══════════════════════════════════════');
  log('📄 PDF → MD CONVERTER');
  log('═══════════════════════════════════════\n');

  const pdfs = collectPdfs(MAT_DIR);
  log(`${pdfs.length} PDFs encontrados`);

  const toConvert = pdfs.filter(p => {
    const name = p.name.toLowerCase();
    return !name.includes('evidencia_') &&
           !name.includes('ie_evidencia') &&
           !name.includes('protocolo') &&
           !name.includes('actualizacion') &&
           !name.endsWith('.php');
  });

  log(`${toConvert.length} para convertir\n`);

  let converted = 0;
  for (const pdf of toConvert) {
    const mdName = pdf.name.replace(/\.pdf$/i, '.md');
    const mdPath = path.join(pdf.parentDir, mdName);
    if (fs.existsSync(mdPath)) { log(`  → Ya existe: ${pdf.name}`); continue; }

    const text = await convertPdf(pdf.fullPath);
    if (!text || text.length < 30) { continue; }

    const md = textToMarkdown(text, pdf.name.replace(/\.pdf$/i, ''));
    fs.writeFileSync(mdPath, md, 'utf8');
    log(`  ✓ ${pdf.name} → ${mdName} (${Math.round(md.length/1024)} KB)`);
    converted++;
  }

  log(`\n✅ ${converted} convertidos`);
}

main().catch(err => { log(`❌ ${err.message}`); process.exit(1); });
