import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY no está configurado.' }, { status: 500 });
    }

    const payload = {
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: 'Eres el asistente integrado de LifeOS. Eres altamente técnico (Senior SRE/QA), sarcástico, directo y siempre mantienes el contexto de Jeiser. Responde de forma muy concisa en Markdown.' },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1500
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de DeepSeek:', errorText);
      return NextResponse.json({ error: `DeepSeek API falló: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'Sin respuesta.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ error: 'Error interno en el servidor.' }, { status: 500 });
  }
}
