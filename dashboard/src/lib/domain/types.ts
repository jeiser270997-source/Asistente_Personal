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

export interface MemoryRecord {
  categoria?: string;
  descripcion?: string;
  hecho?: string;
  creado_en?: string;
  [key: string]: any;
}

export interface DashboardFinances {
  dianDebt: string;
}

export interface DashboardJobs {
  total: number;
  next: JobOffer[];
}

export interface DashboardStatus {
  estadoVivo: string;
  ledger: LegalCase[];
  jobs: DashboardJobs;
  memorias: MemoryRecord[];
  finances: DashboardFinances;
  senaStatus?: string;
}
