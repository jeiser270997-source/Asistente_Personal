/**
 * dashboard-data.ts — Helper unificado para el dashboard de LifeOS.
 *
 * Reemplaza las 3 capas anteriores (domain/ports, application/usecase, infrastructure/repositories)
 * con funciones directas de lectura SQLite + filesystem.
 *
 * Simplificación: ~180 líneas vs ~250 líneas en 5 archivos separados.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ── Tipos (inline, antes estaban en domain/types.ts) ──────────

export interface LegalCase {
  id?: string;
  entidad?: string;
  estado?: string;
  [key: string]: any;
}

export interface JobOffer {
  titulo?: string;
  empresa?: string;
  score?: number;
  ubicacion?: string;
  [key: string]: any;
}

export interface DashboardStatus {
  estadoVivo: string;
  ledger: LegalCase[];
  jobs: { total: number; next: JobOffer[] };
  memorias: any[];
  finances: { dianDebt: string };
  senaStatus?: string;
}

// ── Helpers ─────────────────────────────────────────────────

function getBaseDir(): string {
  return process.env.IS_DOCKER === 'true' ? '/host_data' : path.join(process.cwd(), '..');
}

function readFileSafe(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function readJsonSafe(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

// ── Funciones principales ───────────────────────────────────

/** Lee ESTADO_VIVO.md */
function getRawEstadoVivo(): string {
  const baseDir = getBaseDir();
  return readFileSafe(
    path.join(baseDir, 'data', 'state', 'contexto_maestro', 'ESTADO_VIVO.md')
  );
}

/** Lee casos legales del masterledger */
function getLegalCases(): LegalCase[] {
  const baseDir = getBaseDir();
  return readJsonSafe(path.join(baseDir, 'data', 'state', 'masterledger.json'));
}

/** Lee ofertas pendientes de aplicar */
function getPendingJobs(): JobOffer[] {
  const baseDir = getBaseDir();
  return readJsonSafe(path.join(baseDir, 'scripts', 'data', 'jobs', 'apply_queue.json'));
}

/** Lee las últimas N memorias de la base SQLite hipocampo */
function getRecentMemories(limit: number): any[] {
  const baseDir = getBaseDir();
  const dbPath = path.join(baseDir, 'data', 'memoria_hipocampo.db');
  if (!fs.existsSync(dbPath)) return [];

  let activeDbPath = dbPath;
  if (process.env.IS_DOCKER === 'true') {
    activeDbPath = '/tmp/memoria_hipocampo.db';
    try { fs.copyFileSync(dbPath, activeDbPath); } catch {}
  }

  try {
    const db = new Database(activeDbPath, { readonly: true });
    const rows = db.prepare(`SELECT * FROM hechos ORDER BY timestamp DESC LIMIT ?`).all(limit);
    db.close();
    return rows;
  } catch {
    return [];
  }
}

/** Extrae estado SENA del texto de ESTADO_VIVO */
function extractSenaStatus(text: string): string {
  const match = text.match(/\*\*SENA — Bases de Datos:\*\*\s*(.*)/i);
  return match ? match[1].trim() : 'Sin información reciente.';
}

/** Extrae deuda DIAN del texto de ESTADO_VIVO */
function extractFinances(estadoVivoText: string): { dianDebt: string } {
  const lines = estadoVivoText.split('\n').filter(line => line.includes('Deuda DIAN'));
  let totalDebt = 0;

  for (const line of lines) {
    const match = line.match(/\$([\d,\.]+)(M|K)?/i);
    if (match) {
      let val = parseFloat(match[1].replace(',', '.'));
      if (match[2]?.toUpperCase() === 'M') val *= 1_000_000;
      else if (match[2]?.toUpperCase() === 'K') val *= 1_000;
      totalDebt += val;
    }
  }

  let formatted = '0';
  if (totalDebt >= 1_000_000) formatted = (totalDebt / 1_000_000).toFixed(2) + 'M';
  else if (totalDebt > 0) formatted = totalDebt.toLocaleString('es-CO');

  return { dianDebt: formatted };
}

// ── API pública ─────────────────────────────────────────────

export function getStatus(): DashboardStatus {
  const estadoVivo = getRawEstadoVivo();
  const [ledger, pendingJobs, memorias] = [
    getLegalCases(),
    getPendingJobs(),
    getRecentMemories(10),
  ];

  return {
    estadoVivo,
    ledger,
    jobs: {
      total: pendingJobs.length,
      next: pendingJobs.slice(0, 3),
    },
    memorias,
    finances: extractFinances(estadoVivo),
    senaStatus: extractSenaStatus(estadoVivo),
  };
}
