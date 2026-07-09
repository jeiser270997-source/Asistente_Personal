import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { IMemoryRepository } from '../domain/ports';
import { MemoryRecord } from '../domain/types';

export class SqliteMemoryRepository implements IMemoryRepository {
  private readonly dbPath: string;
  private readonly isDocker: boolean;

  constructor() {
    this.isDocker = process.env.IS_DOCKER === 'true';
    const baseDir = this.isDocker ? '/host_data' : path.join(process.cwd(), '..');
    this.dbPath = path.join(baseDir, 'data', 'memoria_hipocampo.db');
  }

  async getRecentMemories(limit: number): Promise<MemoryRecord[]> {
    if (!fs.existsSync(this.dbPath)) return [];
    
    let activeDbPath = this.dbPath;
    if (this.isDocker) {
      activeDbPath = '/tmp/memoria_hipocampo.db';
      try {
        fs.copyFileSync(this.dbPath, activeDbPath);
      } catch (e) {
        console.error('Failed to copy db to tmp', e);
      }
    }

    try {
      const db = new Database(activeDbPath, { readonly: true });
      const memorias = db.prepare(`SELECT * FROM hechos ORDER BY timestamp DESC LIMIT ?`).all(limit) as MemoryRecord[];
      db.close();
      return memorias;
    } catch (error) {
      console.error('Error in SqliteMemoryRepository:', error);
      return [];
    }
  }
}
