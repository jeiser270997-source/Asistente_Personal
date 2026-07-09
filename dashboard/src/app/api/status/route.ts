import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/dashboard-data';

export async function GET() {
  try {
    const data = getStatus();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
