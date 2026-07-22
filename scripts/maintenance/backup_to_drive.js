require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const fs = require('node:fs');
const path = require('node:path');
const { trashFiles, getOrCreateFolder, uploadFileToDrive } = require('../../lib/integrations/drive_manager');

const VIDEO_FILE_ID = '1_5vVY6dWudA4mPUTXVCW2kdyZR-dOZD2';

const FILES_TO_BACKUP = [
  { path: path.join(__dirname, '..', '..', 'data', 'memoria_hipocampo.db'), name: `memoria_hipocampo_${new Date().toISOString().slice(0,10)}.db` },
  { path: path.join(__dirname, '..', '..', 'data', 'state', 'contexto_maestro', 'ESTADO_VIVO.md'), name: `ESTADO_VIVO_${new Date().toISOString().slice(0,10)}.md` },
  { path: path.join(__dirname, '..', '..', 'data', 'sena', 'scrum', 'curso_scrum_estructura.json'), name: `curso_scrum_estructura_${new Date().toISOString().slice(0,10)}.json` }
];

async function runBackupAndCleanVideo() {
  console.log('🚀 === PROCESO DE MANTENIMIENTO Y RESPALDO GOOGLE DRIVE ===\n');

  // 1. Eliminar video 20260430_115826.mp4
  console.log('🗑️ 1. Moviendo video (20260430_115826.mp4) a la papelera...');
  try {
    const trashResult = await trashFiles([VIDEO_FILE_ID]);
    console.log('   ✅ Video enviado a la papelera exitosamente:', JSON.stringify(trashResult, null, 2));
  } catch (err) {
    console.error('   ⚠️ No se pudo eliminar el video:', err.message);
  }

  // 2. Crear/Obtener carpeta LifeOS_Backups en Drive
  console.log('\n📂 2. Creando/Verificando carpeta "LifeOS_Backups" en Google Drive...');
  const folderId = await getOrCreateFolder('LifeOS_Backups');
  console.log(`   ✅ Carpeta de respaldos lista (ID: ${folderId})`);

  // 3. Subir archivos de respaldo del asistente
  console.log('\n☁️ 3. Subiendo datos del asistente (memoria, estado vivo, estructuras)...');
  const uploadedFiles = [];

  for (const item of FILES_TO_BACKUP) {
    if (fs.existsSync(item.path)) {
      console.log(`   Subiendo: ${item.name}...`);
      const res = await uploadFileToDrive(item.path, folderId, item.name);
      console.log(`   ✓ Subido con éxito: ${res.name} (ID: ${res.id})`);
      uploadedFiles.push(res);
    } else {
      console.warn(`   ⚠️ Archivo no encontrado en local: ${item.path}`);
    }
  }

  console.log('\n==================================================');
  console.log('✅ PROCESO COMPLETADO EXITOSAMENTE!');
  console.log(`📦 Video eliminado y ${uploadedFiles.length} archivo(s) del asistente respaldados en Google Drive ("LifeOS_Backups").`);
  console.log('==================================================\n');
}

runBackupAndCleanVideo().catch(err => {
  console.error('❌ Error en proceso de respaldo:', err.message);
  process.exit(1);
});
