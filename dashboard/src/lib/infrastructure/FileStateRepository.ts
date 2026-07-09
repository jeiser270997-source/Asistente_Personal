import fs from 'fs';
import path from 'path';
import { IStateRepository } from '../domain/ports';
import { LegalCase, JobOffer } from '../domain/types';

export class FileStateRepository implements IStateRepository {
  private readonly baseDir: string;

  constructor() {
    const isDocker = process.env.IS_DOCKER === 'true';
    this.baseDir = isDocker ? '/host_data' : path.join(process.cwd(), '..');
  }

  async getRawEstadoVivo(): Promise<string> {
    const estadoVivoPath = path.join(this.baseDir, 'data', 'state', 'contexto_maestro', 'ESTADO_VIVO.md');
    if (!fs.existsSync(estadoVivoPath)) return '';
    return fs.readFileSync(estadoVivoPath, 'utf8');
  }

  async getLegalCases(): Promise<LegalCase[]> {
    const ledgerPath = path.join(this.baseDir, 'data', 'state', 'masterledger.json');
    if (!fs.existsSync(ledgerPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch {
      return [];
    }
  }

  async getPendingJobs(): Promise<JobOffer[]> {
    const queuePath = path.join(this.baseDir, 'scripts', 'data', 'jobs', 'apply_queue.json');
    if (!fs.existsSync(queuePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    } catch {
      return [];
    }
  }
}
