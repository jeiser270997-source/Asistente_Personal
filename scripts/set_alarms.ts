import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const adbPath = process.env.ADB_PATH;

if (!adbPath) {
  console.error("❌ ERROR: ADB_PATH no está configurado en .env");
  process.exit(1);
}

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
    console.log(`Setting alarm: ${a.msg} at ${a.h}:${a.m} on days ${a.days}`);
    execSync(cmd, { stdio: 'ignore' });
  } catch (e: any) {
    console.error(`Error setting ${a.msg}: ${e.message}`);
  }
}

console.log('✅ All recurring alarms set clean via ADB!');
