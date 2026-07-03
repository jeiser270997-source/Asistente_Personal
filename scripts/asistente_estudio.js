require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:latest';

// Cargar Skill y Contexto
const CONTEXT_PATH = path.join(__dirname, '..', 'ctx-qa.md');
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'tutor_qa.md');

let studyContext = fs.existsSync(CONTEXT_PATH) ? fs.readFileSync(CONTEXT_PATH, 'utf8') : '';
let systemSkill = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : 'Eres un tutor inteligente.';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const chatHistory = [];

async function preguntarOllama(prompt) {
  const url = `${OLLAMA_HOST.replace(/\/+$/, '')}/chat/completions`;
  
  // Truncamos el contexto a ~80,000 caracteres para no saturar la RAM/VRAM
  const safeContext = studyContext.substring(0, 80000);
  const systemInstructions = `${systemSkill}\n\n[CONTEXTO DE ESTUDIO]\n${safeContext}`;

  const messages = [
    { role: 'system', content: systemInstructions },
    ...chatHistory,
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: OLLAMA_MODEL, 
        messages: messages, 
        temperature: 0.3,
        keep_alive: 0 // PROTECCIÓN DE VRAM
      })
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sin respuesta del modelo local.';
  } catch (error) {
    return `❌ Error al conectar con Ollama: ${error.message}`;
  }
}

function iniciarChat() {
  console.log('\n========================================================');
  console.log(`🎓 BOOTCAMP QA LOCAL (${OLLAMA_MODEL})`);
  console.log('Escribe tu duda o pide un ejercicio. Escribe "salir" para terminar.');
  console.log('========================================================\n');

  const preguntar = () => {
    rl.question('👤 Jeiser > ', async (input) => {
      if (input.toLowerCase() === 'salir') {
        console.log('👋 ¡Sigue practicando! Hasta luego.');
        process.exit(0);
      }
      if (!input.trim()) return preguntar();

      process.stdout.write('🤖 Pensando...\r');
      const respuesta = await preguntarOllama(input);
      
      // Limpiar la línea de "Pensando..."
      process.stdout.write('\x1b[2K\r');
      console.log(`🤖 Tutor QA:\n${respuesta}\n`);

      chatHistory.push({ role: 'user', content: input });
      chatHistory.push({ role: 'assistant', content: respuesta });
      
      // Mantener memoria corta para no saturar
      if (chatHistory.length > 6) chatHistory.splice(0, 2);

      preguntar();
    });
  };
  preguntar();
}

iniciarChat();
