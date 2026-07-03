require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');

const INBOX_DIR = process.env.INBOX_DIR || path.join('C:\\Users', 'dev', 'Desktop', 'INBOX_JEISER');
const RESPALDO_BASE = process.env.RESPALDO_BASE || path.join('E:\\', 'PROYECTOS', 'Respaldos', 'INBOX');
const LOG_FILE = process.env.ORGANIZE_LOG_FILE || path.join(__dirname, '..', 'logs', 'organize_inbox.log');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {}
}

function getExtensionCategory(ext) {
  const map = {
    '.pdf': 'Documentos',
    '.doc': 'Documentos', '.docx': 'Documentos',
    '.xls': 'Documentos', '.xlsx': 'Documentos',
    '.jpg': 'Imagenes', '.jpeg': 'Imagenes',
    '.png': 'Imagenes', '.gif': 'Imagenes', '.webp': 'Imagenes',
    '.mp4': 'Videos', '.avi': 'Videos', '.mov': 'Videos',
    '.mp3': 'Audio', '.wav': 'Audio',
    '.zip': 'Comprimidos', '.rar': 'Comprimidos', '.7z': 'Comprimidos',
    '.txt': 'Textos', '.md': 'Textos',
    '.exe': 'Ejecutables', '.msi': 'Ejecutables',
  };
  return map[ext.toLowerCase()] || 'Otros';
}

function run() {
  log('🚀 Iniciando Organizador de INBOX...');

  if (!fs.existsSync(INBOX_DIR)) {
    log(`⚠️ No existe INBOX_JEISER en ${INBOX_DIR}`);
    return;
  }

  const files = fs.readdirSync(INBOX_DIR).filter(f => {
    const full = path.join(INBOX_DIR, f);
    return fs.statSync(full).isFile();
  });

  if (files.length === 0) {
    log('📭 INBOX_JEISER vacío. Nada que organizar.');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  let moved = 0;

  for (const file of files) {
    const src = path.join(INBOX_DIR, file);
    const ext = path.extname(file);
    const category = getExtensionCategory(ext);
    const destDir = path.join(RESPALDO_BASE, dateStr, category);

    try {
      fs.mkdirSync(destDir, { recursive: true });
      const dest = path.join(destDir, file);
      let finalDest = dest;
      let counter = 1;
      while (fs.existsSync(finalDest)) {
        const name = path.parse(file).name;
        finalDest = path.join(destDir, `${name}_${counter}${ext}`);
        counter++;
      }
      fs.renameSync(src, finalDest);
      log(`📦 ${file} → ${path.relative(RESPALDO_BASE, finalDest)}`);
      moved++;
    } catch (err) {
      log(`❌ Error moviendo ${file}: ${err.message}`);
    }
  }

  log(`✅ Organización completada: ${moved} archivos movidos.`);
}

run();
