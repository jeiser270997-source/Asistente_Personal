import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Dynamic ADB path resolution ──

function resolveAdbPath(): string {
  // 1. Variable de entorno explícita
  if (process.env.ADB_PATH && fs.existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }

  // 2. Intentar ejecutar adb desde el PATH del sistema
  try {
    execSync('adb --version', { stdio: 'ignore' });
    return 'adb';
  } catch { /* not in PATH */ }

  // 3. Fallback para Windows (Android Studio default)
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const winPath = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    if (fs.existsSync(winPath)) return winPath;
  }

  // 4. Fallback para macOS
  if (process.platform === 'darwin') {
    const macPath = path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
    if (fs.existsSync(macPath)) return macPath;
  }

  throw new Error(
    'ADB no encontrado. Instala Android Platform Tools o configura ADB_PATH en .env'
  );
}

let adbPath: string;
try {
  adbPath = resolveAdbPath();
  console.log(`🔧 Usando ADB: ${adbPath}`);
} catch (e: any) {
  console.error(`❌ ERROR: ${e.message}`);
  process.exit(1);
}

// ── Alarm configuration ──

interface AlarmConfig {
  h: number;
  m: number;
  days: string;
  msg: string;
}

const alarmsConfigPath = path.join(__dirname, '..', 'config', 'alarms.json');

if (!fs.existsSync(alarmsConfigPath)) {
  console.error(`❌ ERROR: No se encontró el archivo de configuración ${alarmsConfigPath}`);
  process.exit(1);
}

const alarms: AlarmConfig[] = JSON.parse(fs.readFileSync(alarmsConfigPath, 'utf8'));

for (const a of alarms) {
  const cmd = `${adbPath} shell am start -a android.intent.action.SET_ALARM --ei android.intent.extra.alarm.HOUR ${a.h} --ei android.intent.extra.alarm.MINUTES ${a.m} --eia android.intent.extra.alarm.DAYS ${a.days} --ez android.intent.extra.alarm.SKIP_UI true --es android.intent.extra.alarm.MESSAGE "${a.msg}"`;
  try {
    console.log(`⏰ Setting alarm: ${a.msg} at ${a.h}:${a.m} on days ${a.days}`);
    execSync(cmd, { stdio: 'ignore' });
  } catch (e: any) {
    console.error(`❌ Error setting ${a.msg}: ${e.message}`);
  }
}

console.log('✅ All recurring alarms set clean via ADB!');
