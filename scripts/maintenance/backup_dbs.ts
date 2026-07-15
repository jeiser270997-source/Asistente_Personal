import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.join(__dirname, '..', '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', 'drive_sync');

// Asegurar que el directorio destino existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generar nombre del archivo con timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
const backupFile = path.join(BACKUP_DIR, `lifeos_dbs_${timestamp}.zip`);

// Rutas de las bases de datos a respaldar (paths canónicos)
const dbPaths = [
  path.join(ROOT_DIR, 'data', 'memoria_hipocampo.db'),
  path.join(ROOT_DIR, 'runtime', 'lifeos.db')
].filter(p => fs.existsSync(p)); // Solo las que realmente existen

if (dbPaths.length === 0) {
  console.log("⚠️ No se encontraron bases de datos para respaldar.");
  process.exit(0);
}

// Convertir rutas a strings para PowerShell
const pathsForPs = dbPaths.map(p => `"${p}"`).join(', ');

// Comando PowerShell para crear el ZIP
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path ${pathsForPs} -DestinationPath '${backupFile}' -Force"`;

console.log(`📦 Iniciando backup de ${dbPaths.length} bases de datos...`);

try {
  execSync(psCommand, { stdio: 'inherit' });
  console.log(`✅ Backup completado exitosamente: ${backupFile}`);

  // Intento de copia automática a Google Drive Desktop
  const gDrivePath = 'G:\\My Drive';
  if (fs.existsSync(gDrivePath)) {
    const gDriveBackupDir = path.join(gDrivePath, 'LifeOS_Backups');
    if (!fs.existsSync(gDriveBackupDir)) {
      fs.mkdirSync(gDriveBackupDir, { recursive: true });
    }
    const destPath = path.join(gDriveBackupDir, path.basename(backupFile));
    fs.copyFileSync(backupFile, destPath);
    console.log(`☁️ Backup copiado exitosamente a Google Drive: ${destPath}`);
  } else {
    console.log(`☁️ Nota: No se detectó 'G:\\My Drive' para copia automática.`);
  }

} catch (error: any) {
  console.error(`❌ Error al crear el backup:`, error.message);
  process.exit(1);
}
