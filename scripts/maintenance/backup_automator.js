const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.resolve(__dirname, '..', '..');
const BACKUP_DIR = path.join(BASE_DIR, 'data', 'backups');

function runBackup() {
    console.log('🔄 Iniciando Backup Automático de LifeOS...');
    
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const zipName = `lifeos_backup_${date}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    // Recursos críticos según la skill backup-automator
    const criticalResources = [
        'data/memoria_hipocampo.db',
        'data/state',
        '.agents/skills',
        '.env',
        'token.json',
        '.google_token.json',
        'credentials.json'
    ];

    console.log('📦 Recopilando archivos críticos...');
    
    // Crear directorio temporal para organizar el zip
    const tempDir = path.join(BACKUP_DIR, 'temp_backup');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    let filesCopied = 0;
    for (const res of criticalResources) {
        const fullPath = path.join(BASE_DIR, res);
        if (fs.existsSync(fullPath)) {
            const destPath = path.join(tempDir, res);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            
            if (fs.statSync(fullPath).isDirectory()) {
                fs.cpSync(fullPath, destPath, { recursive: true });
            } else {
                fs.copyFileSync(fullPath, destPath);
            }
            console.log(` ✅ Copiado: ${res}`);
            filesCopied++;
        } else {
            console.log(` ⚠️ No encontrado (se omite): ${res}`);
        }
    }

    if (filesCopied === 0) {
        console.error('❌ No se encontró ningún archivo crítico para respaldar.');
        return;
    }

    // Comprimir con PowerShell Compress-Archive
    console.log(`🗜️  Comprimiendo backup a ${zipName}...`);
    try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); // Borrar si ya existe backup de hoy
        
        // Powershell compress-archive
        const psCommand = `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`;
        execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'inherit' });
        console.log(`✅ Backup local creado con éxito en: ${zipPath}`);
    } catch (err) {
        console.error('❌ Error al comprimir el backup:', err.message);
    } finally {
        // Limpiar temp
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Sincronizar con Rclone si está configurado
    console.log('☁️  Verificando integración con Rclone...');
    try {
        // Chequea si existe el comando y si hay remotos configurados
        execSync('rclone version', { stdio: 'ignore' });
        
        // Asumimos que el remote se llamará "LifeOS_Backup"
        const rcloneConfig = execSync('rclone listremotes').toString();
        if (rcloneConfig.includes('LifeOS_Backup:')) {
            console.log('🚀 Sincronizando con Google Drive (LifeOS_Backup)...');
            execSync(`rclone sync "${BACKUP_DIR}" "LifeOS_Backup:backups" -v`, { stdio: 'inherit' });
            console.log('✅ Sincronización en la nube completada.');
        } else {
            console.log('⚠️  El remote "LifeOS_Backup" no está configurado en Rclone.');
            console.log('   -> Ejecuta "rclone config" para crearlo y vincular tu Google Drive.');
        }
    } catch (err) {
        console.log('⚠️  Rclone no está instalado o falló. Sáltando sincronización en la nube.');
    }

    // Limpieza: Mantener solo los últimos 7 backups locales
    console.log('🧹 Limpiando backups antiguos (retención 7 días)...');
    try {
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('lifeos_backup_') && f.endsWith('.zip'));
        if (files.length > 7) {
            files.sort((a, b) => {
                return fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime();
            });
            const toDelete = files.slice(7);
            for (const file of toDelete) {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(` 🗑️  Eliminado backup antiguo: ${file}`);
            }
        }
    } catch (err) {
        console.error('❌ Error al limpiar backups antiguos:', err.message);
    }

    console.log('🎉 Proceso de backup finalizado exitosamente.');
}

runBackup();
