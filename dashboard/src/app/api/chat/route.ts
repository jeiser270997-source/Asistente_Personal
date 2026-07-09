import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    // Probar proveedores en orden: OpenRouter → Groq
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY no está configurado.' }, { status: 500 });
    }

    const baseURL = process.env.OPENROUTER_API_KEY
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.groq.com/openai/v1';
    const model = process.env.OPENROUTER_API_KEY
      ? 'google/gemini-2.5-flash'
      : 'llama-3.3-70b-versatile';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    if (process.env.OPENROUTER_API_KEY) {
      headers['HTTP-Referer'] = 'https://github.com/jeiser-dev/lifeos';
      headers['X-Title'] = 'LifeOS';
    }

    const payload = {
      model,
      messages: [
        { role: 'system', content: 'Eres el asistente integrado de LifeOS. Eres altamente técnico (Senior SRE/QA), sarcástico, directo y siempre mantienes el contexto de Jeiser. Responde de forma muy concisa en Markdown.' },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1500
    };

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del LLM:', errorText);
      return NextResponse.json({ error: `LLM API falló: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'Sin respuesta.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ error: 'Error interno en el servidor.' }, { status: 500 });
  }
}
