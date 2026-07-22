require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const { listFiles, trashFiles } = require('../../lib/integrations/drive_manager');

// Palabras clave y patrones para identificar archivos IMPORTANTES que NUNCA deben borrarse
const KEEP_KEYWORDS = [
  'cedula', 'documento', 'soat', 'rtm', 'tecnomecanica', 'dian', 'sena', 'cesde',
  'certificado', 'matrícula', 'impuesto', 'vehiculo', 'toyota', 'corolla', 'kew496',
  'contrato', 'didi', 'trabajo', 'hv', 'hoja_de_vida', 'cv', 'scrum', 'bases_datos',
  'backup', 'bd', 'sql', 'clave', 'credencial', 'dian_ag'
];

// Palabras clave y extensiones para identificar BASURA / Archivos temporales prescindibles
const JUNK_KEYWORDS = [
  'tmp', 'temp', 'copia', 'copy', 'borrador', 'draft', 'untilted', 'sin_titulo',
  'untitled', 'installer', 'setup', 'cache', 'log', 'out', 'download', 'descarga'
];

const JUNK_EXTENSIONS = ['.tmp', '.log', '.exe', '.dmg', '.iso', '.crdownload', '.part', '.bak'];

function classifyFile(file) {
  const nameLower = file.name.toLowerCase();
  const sizeMB = file.quotaBytesUsed ? (parseInt(file.quotaBytesUsed) / (1024 * 1024)).toFixed(2) : '0.00';

  // Check if file matches keep keywords
  for (const kw of KEEP_KEYWORDS) {
    if (nameLower.includes(kw)) {
      return { category: 'CONSERVAR', reason: `Coincide con palabra clave importante "${kw}"` };
    }
  }

  // Check if file matches junk extensions or junk keywords
  for (const ext of JUNK_EXTENSIONS) {
    if (nameLower.endsWith(ext)) {
      return { category: 'BASURA', reason: `Extensión de archivo temporal o instalador "${ext}"` };
    }
  }

  for (const kw of JUNK_KEYWORDS) {
    if (nameLower.includes(kw)) {
      return { category: 'BASURA', reason: `Coincide con palabra clave de archivo basura/temporal "${kw}"` };
    }
  }

  // Large video or zip files without clear name -> Mark for review
  if (parseFloat(sizeMB) > 50) {
    return { category: 'REVISAR', reason: `Archivo grande (${sizeMB} MB), requiere confirmación` };
  }

  return { category: 'CONSERVAR', reason: 'Archivo estándar sin patrones de basura' };
}

async function smartCleanDrive(dryRun = true) {
  console.log(`🤖 ANALIZADOR INTELIGENTE DE GOOGLE DRIVE (${dryRun ? 'MODO SIMULACIÓN / DRY-RUN' : 'MODO LIMPIEZA REAL'})\n`);

  const files = await listFiles({ pageSize: 50, orderBy: 'quotaBytesUsed desc' });
  if (!files || files.length === 0) {
    console.log('No se encontraron archivos para analizar.');
    return;
  }

  const trashList = [];
  const keepList = [];
  const reviewList = [];

  for (const file of files) {
    const analysis = classifyFile(file);
    const sizeMB = file.quotaBytesUsed ? (parseInt(file.quotaBytesUsed) / (1024 * 1024)).toFixed(2) : '0.00';

    const item = { id: file.id, name: file.name, sizeMB, reason: analysis.reason };

    if (analysis.category === 'BASURA') {
      trashList.push(item);
    } else if (analysis.category === 'REVISAR') {
      reviewList.push(item);
    } else {
      keepList.push(item);
    }
  }

  console.log('🟢 --- ARCHIVOS CLASIFICADOS COMO IMPORTANTES (SE CONSERVAN 100%) ---');
  for (const f of keepList.slice(0, 10)) {
    console.log(`  ✓ ${f.name.padEnd(40)} (${f.sizeMB} MB) -> ${f.reason}`);
  }
  console.log(`  ... Total importantes protegidos: ${keepList.length} archivo(s)\n`);

  if (reviewList.length > 0) {
    console.log('🟡 --- ARCHIVOS GRANDES O DUDOSOS (REQUIEREN TU REVISIÓN) ---');
    for (const f of reviewList) {
      console.log(`  ⚠️ [ID: ${f.id}] ${f.name} (${f.sizeMB} MB) -> ${f.reason}`);
    }
    console.log('');
  }

  console.log('🔴 --- ARCHIVOS IDENTIFICADOS COMO BASURA / TEMPORALES ---');
  if (trashList.length === 0) {
    console.log('  ✨ No se encontraron archivos basura evidentes.');
  } else {
    for (const f of trashList) {
      console.log(`  🗑️ [ID: ${f.id}] ${f.name} (${f.sizeMB} MB) -> ${f.reason}`);
    }

    if (!dryRun) {
      console.log('\n🚀 Moviendo archivos basura a la papelera...');
      const ids = trashList.map(t => t.id);
      const res = await trashFiles(ids);
      console.log(`✅ ${res.length} archivo(s) basura movidos a la papelera exitosamente.`);
    } else {
      console.log('\n💡 Para ejecutar la limpieza real, ejecuta: node scripts/integrations/drive_smart_cleaner.js --execute');
    }
  }
}

const isExecute = process.argv.includes('--execute');
smartCleanDrive(!isExecute).catch(err => {
  console.error('❌ Error en analizador inteligente:', err.message);
  process.exit(1);
});
