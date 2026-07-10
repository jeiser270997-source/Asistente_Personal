import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content;
    if (!lastMessage) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    // Resolver la ruta hacia el lóbulo frontal de LifeOS
    const rootDir = process.env.IS_DOCKER === 'true' ? '/host_data' : path.join(process.cwd(), '..');
    const frontalPath = path.join(rootDir, 'lib', 'lobulos', 'frontal');

    // Bypass de Webpack: usar eval('require') para forzar la carga nativa de Node.js en tiempo de ejecución
    const nativeRequire = eval('require');
    const frontal = nativeRequire(frontalPath);

    console.log(`🧠 [Dashboard Chat] Procesando pensamiento nativo para: "${lastMessage.substring(0, 40)}..."`);
    const reply = await frontal.procesarPensamiento(lastMessage);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
