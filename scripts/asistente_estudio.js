require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:latest';
const CONTEXT_PATH = path.join(__dirname, '..', 'ctx-estudio.md');

let studyContext = '';
if (fs.existsSync(CONTEXT_PATH)) {
  console.log('📚 Cargando tu contexto de estudio (ctx-estudio.md)...');
  studyContext = fs.readFileSync(CONTEXT_PATH, 'utf8');
} else {
  console.log('⚠️ No se encontró ctx-estudio.md. Ejecuta generar_contexto.py primero.');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const chatHistory = [];

async function preguntarOllama(prompt) {
  const url = ${OLLAMA_HOST.replace(/\/+$/, '')}/chat/completions;
  const systemInstructions = studyContext 
    ? Eres un tutor de estudio inteligente para Jeiser. Utiliza el siguiente contexto:\n\n[CONTEXTO]\n
    : 'Eres un tutor de estudio inteligente para Jeiser.';

  const messages = [
    { role: 'system', content: systemInstructions },
    ...chatHistory,
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages: messages, temperature: 0.5 })
    });

    if (!response.ok) throw new Error(Error HTTP: );
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No obtuve respuesta del modelo local.';
  } catch (error) {
    return ❌ Error al conectar con Ollama: \n¿Está Ollama ejecutándose?;
  }
}

function iniciarChat() {
  console.log('\n========================================================');
  console.log(🎓 ASISTENTE DE ESTUDIO LOCAL ());
  console.log('Escribe tu duda. Escribe "salir" para terminar.');
  console.log('========================================================\n');

  const preguntar = () => {
    rl.question('👤 Jeiser > ', async (input) => {
      if (input.toLowerCase() === 'salir') {
        console.log('👋 ¡Buen trabajo! Hasta luego.');
        process.exit(0);
      }
      if (!input.trim()) return preguntar();

      console.log('🤖 Pensando...');
      const respuesta = await preguntarOllama(input);
      console.log(\n🤖 Tutor:\n\n);

      chatHistory.push({ role: 'user', content: input });
      chatHistory.push({ role: 'assistant', content: respuesta });
      if (chatHistory.length > 10) chatHistory.splice(0, 2); // Mantener memoria corta

      preguntar();
    });
  };
  preguntar();
}

iniciarChat();
