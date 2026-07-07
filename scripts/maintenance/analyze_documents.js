require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(BASE_DIR, 'data', 'documentos');
const ANALYSIS_FILE = path.join(DOCS_DIR, 'analisis.json');

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function loadAnalysis() {
  try {
    if (fs.existsSync(ANALYSIS_FILE)) return JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveAnalysis(data) {
  const dir = path.dirname(ANALYSIS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(data, null, 2));
}

async function analyzePDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.substring(0, 4000);
  } catch (e) {
    return `[Error extrayendo texto: ${e.message}]`;
  }
}

function findNewPDFs(analysis) {
  const results = [];
  if (!fs.existsSync(DOCS_DIR)) return results;

  const dates = fs.readdirSync(DOCS_DIR).filter(d => {
    const p = path.join(DOCS_DIR, d);
    return fs.statSync(p).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d);
  });

  for (const date of dates) {
    const dateDir = path.join(DOCS_DIR, date);
    const emails = fs.readdirSync(dateDir).filter(d => {
      return fs.statSync(path.join(dateDir, d)).isDirectory();
    });

    for (const email of emails) {
      const emailDir = path.join(dateDir, email);
      const files = fs.readdirSync(emailDir).filter(f => f.endsWith('.pdf'));

      for (const file of files) {
        const filePath = path.join(emailDir, file);
        const key = `${date}/${email}/${file}`;
        if (!analysis[key]) {
          results.push({ key, filePath, date, email, file });
        }
      }
    }
  }
  return results;
}

async function main() {
  log('🔍 Buscando documentos nuevos para analizar...');

  const analysis = loadAnalysis();
  const newDocs = findNewPDFs(analysis);

  log(`${newDocs.length} documentos nuevos sin analizar`);

  if (newDocs.length === 0) {
    log('✅ Nada nuevo.');
    return { analyzed: 0 };
  }

  const SYSTEM_PROMPT = `Eres un analista de documentos legales y administrativos colombianos.
Tu trabajo es extraer la información CLAVE de cada documento en español.
Para CADA documento, responde con EXACTAMENTE esto:

TIPO: [tipo de documento: resolución, comparendo, certificado, notificación, contrato, etc.]
ENTIDAD: [quién lo emite]
FECHA: [fecha del documento]
RESUMEN (1 línea): [qué dice en una frase]
ACCIÓN REQUERIDA: [qué tiene que hacer Jeiser, si aplica. Si no, escribe "NINGUNA"]
PLAZO: [fecha límite si tiene, si no "SIN PLAZO"]
MONTO: [si hay dinero involucrado, si no "N/A"]`;

  let count = 0;
  for (const doc of newDocs) {
    log(`📄 Analizando: ${doc.key}`);
    const text = await analyzePDF(doc.filePath);

    if (text.startsWith('[Error')) {
      analysis[doc.key] = { error: text, analyzedAt: new Date().toISOString() };
      continue;
    }

    try {
      const response = await askLLM(SYSTEM_PROMPT, [
        { role: 'user', content: `Analiza este documento:\n\n${text}` }
      ]);
      const content = response?.content || 'No se pudo analizar';

      analysis[doc.key] = {
        rawText: text.substring(0, 500),
        analysis: content,
        file: doc.filePath,
        analyzedAt: new Date().toISOString()
      };
      count++;
      log(`✅ Analizado (${count}/${newDocs.length})`);
    } catch (e) {
      log(`❌ Error LLM: ${e.message}`);
      analysis[doc.key] = { error: e.message, analyzedAt: new Date().toISOString() };
    }
  }

  saveAnalysis(analysis);
  log(`🏁 ${count} documentos analizados.`);
  return { analyzed: count, total: Object.keys(analysis).length };
}

if (require.main === module) {
  main().catch(e => { log(`💥 FATAL: ${e.message}`); process.exit(1); });
}

module.exports = { main };
