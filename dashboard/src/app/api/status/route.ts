import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/dashboard-data';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }
  try {
    const data = getStatus();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en /api/status:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
