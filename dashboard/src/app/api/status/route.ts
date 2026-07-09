import { NextResponse } from 'next/server';
import { FileStateRepository } from '@/lib/infrastructure/FileStateRepository';
import { SqliteMemoryRepository } from '@/lib/infrastructure/SqliteMemoryRepository';
import { GetDashboardStatusUseCase } from '@/lib/application/GetDashboardStatusUseCase';

export async function GET() {
  try {
    // 1. Instanciamos los Adaptadores de Infraestructura (DB y FS)
    const stateRepo = new FileStateRepository();
    const memoryRepo = new SqliteMemoryRepository();

    // 2. Inyectamos los Adaptadores al Caso de Uso (Inyección de Dependencias)
    const useCase = new GetDashboardStatusUseCase(stateRepo, memoryRepo);

    // 3. Ejecutamos la lógica de negocio pura
    const data = await useCase.execute();

    // 4. Devolvemos la respuesta
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
