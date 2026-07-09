import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const IS_DOCKER = process.env.IS_DOCKER === 'true';
const BASE_DIR = IS_DOCKER ? '/app' : path.join(process.cwd(), '..');

export async function GET() {
  try {
    // 1. Leer ESTADO_VIVO.md
    const estadoVivoPath = path.join(BASE_DIR, 'data', 'state', 'contexto_maestro', 'ESTADO_VIVO.md');
    const estadoVivo = fs.existsSync(estadoVivoPath) ? fs.readFileSync(estadoVivoPath, 'utf8') : '';

    // 2. Leer masterledger.json
    const ledgerPath = path.join(BASE_DIR, 'data', 'state', 'masterledger.json');
    const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : [];

    // 3. Trabajos pendientes de Computrabajo
    const queuePath = path.join(BASE_DIR, 'scripts', 'data', 'jobs', 'queue.json');
    let jobsQueue: any[] = [];
    if (fs.existsSync(queuePath)) {
        try {
            jobsQueue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
        } catch {}
    }

    // 4. Últimas memorias (SQLite)
    let memorias: any[] = [];
    try {
      const dbPath = path.join(BASE_DIR, 'runtime', 'lifeos.db');
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        memorias = db.prepare('SELECT * FROM hechos ORDER BY creado_en DESC LIMIT 10').all();
        db.close();
      }
    } catch (dbErr) {
      console.error('Error leyendo SQLite:', dbErr);
    }

    // Extraer finanzas rápídamente de ESTADO_VIVO.md si se puede
    const didiMatch = estadoVivo.match(/Deuda DIAN:\s*\$?([\d,\.]+)/i);
    const dianDebt = didiMatch ? didiMatch[1] : '0';

    return NextResponse.json({
      estadoVivo,
      ledger,
      jobs: {
        total: jobsQueue.length || 0,
        next: jobsQueue.slice(0, 3)
      },
      memorias,
      finances: {
        dianDebt
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
