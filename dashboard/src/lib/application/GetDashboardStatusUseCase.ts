import { IStateRepository, IMemoryRepository } from '../domain/ports';
import { DashboardStatus, DashboardFinances } from '../domain/types';

export class GetDashboardStatusUseCase {
  constructor(
    private readonly stateRepository: IStateRepository,
    private readonly memoryRepository: IMemoryRepository
  ) {}

  async execute(): Promise<DashboardStatus> {
    const [estadoVivo, ledger, pendingJobs, memorias] = await Promise.all([
      this.stateRepository.getRawEstadoVivo(),
      this.stateRepository.getLegalCases(),
      this.stateRepository.getPendingJobs(),
      this.memoryRepository.getRecentMemories(10)
    ]);

    const finances = this.extractFinances(estadoVivo);

    return {
      estadoVivo,
      ledger,
      jobs: {
        total: pendingJobs.length,
        next: pendingJobs.slice(0, 3)
      },
      memorias,
      finances,
      senaStatus: this.extractSenaStatus(estadoVivo)
    };
  }

  private extractSenaStatus(estadoVivoText: string): string {
    const match = estadoVivoText.match(/\*\*SENA — Bases de Datos:\*\*\s*(.*)/i);
    return match ? match[1].trim() : 'Sin información reciente.';
  }

  private extractFinances(estadoVivoText: string): DashboardFinances {
    const lines = estadoVivoText.split('\n').filter(line => line.includes('Deuda DIAN'));
    let totalDebt = 0;
    
    lines.forEach(line => {
      const match = line.match(/\$([\d,\.]+)(M|K)?/i);
      if (match) {
        let val = parseFloat(match[1].replace(',', '.'));
        if (match[2] && match[2].toUpperCase() === 'M') val *= 1000000;
        else if (match[2] && match[2].toUpperCase() === 'K') val *= 1000;
        totalDebt += val;
      }
    });

    let formatted = '0';
    if (totalDebt >= 1000000) {
      formatted = (totalDebt / 1000000).toFixed(2) + 'M';
    } else if (totalDebt > 0) {
      formatted = totalDebt.toLocaleString('es-CO');
    }

    return {
      dianDebt: formatted
    };
  }
}
