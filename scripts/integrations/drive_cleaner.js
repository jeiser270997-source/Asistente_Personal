require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env'), override: true });
const { listFiles, trashFiles, emptyTrash } = require('../../lib/integrations/drive_manager');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  console.log('📂 === GOOGLE DRIVE CLEANER SYSTEM ===');

  if (command === 'list') {
    console.log('🔎 Escaneando los archivos que más consumen espacio en tu Google Drive...\n');
    const files = await listFiles({ pageSize: 25, orderBy: 'quotaBytesUsed desc' });
    
    if (!files || files.length === 0) {
      console.log('No se encontraron archivos en Google Drive.');
      return;
    }

    console.log(`%-30s | %-12s | %-25s | %s`, 'NOMBRE DE ARCHIVO', 'TAMAÑO (MB)', 'ÚLTIMA MODIFICACIÓN', 'ID');
    console.log('-'.repeat(95));

    for (const f of files) {
      const sizeMB = f.quotaBytesUsed ? (parseInt(f.quotaBytesUsed) / (1024 * 1024)).toFixed(2) : '0.00';
      const date = f.modifiedTime ? f.modifiedTime.slice(0, 10) : 'N/A';
      console.log(`${f.name.slice(0, 30).padEnd(30)} | ${sizeMB.padStart(12)} MB | ${date.padEnd(25)} | ${f.id}`);
    }
  } else if (command === 'trash') {
    const fileId = args[1];
    if (!fileId) {
      console.log('⚠️ Uso: node scripts/integrations/drive_cleaner.js trash <file_id>');
      return;
    }
    console.log(`🗑️ Moviendo a la papelera el archivo ID: ${fileId}...`);
    const res = await trashFiles([fileId]);
    console.log('✅ Archivo movido a la papelera:', JSON.stringify(res, null, 2));
  } else if (command === 'empty') {
    console.log('⚠️ Vaciando permanentemente la Papelera de Google Drive...');
    const res = await emptyTrash();
    console.log('✅ Papelera vaciada:', res.message);
  } else {
    console.log('Comandos disponibles:');
    console.log('  node scripts/integrations/drive_cleaner.js list    - Lista archivos por tamaño');
    console.log('  node scripts/integrations/drive_cleaner.js trash <id> - Mueve archivo a la papelera');
    console.log('  node scripts/integrations/drive_cleaner.js empty  - Vacía la papelera permanentemente');
  }
}

main().catch(err => {
  console.error('❌ Error en Drive Cleaner:', err.message);
  process.exit(1);
});
