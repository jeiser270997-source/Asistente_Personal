import { LegalCase, JobOffer, MemoryRecord } from './types';

export interface IStateRepository {
  getRawEstadoVivo(): Promise<string>;
  getLegalCases(): Promise<LegalCase[]>;
  getPendingJobs(): Promise<JobOffer[]>;
}

export interface IMemoryRepository {
  getRecentMemories(limit: number): Promise<MemoryRecord[]>;
}
