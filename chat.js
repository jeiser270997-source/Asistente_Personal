const readline = require('readline');
const frontal = require('./lib/lobulos/frontal');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('==================================================================');
console.log('🧠 LIFEOS - JARVIS NATIVE CLI TERMINAL');
console.log('   Escribe tu mensaje o ingresa "salir" para terminar.');
console.log('==================================================================\n');

function prompt() {
  rl.question('👤 Jeiser > ', async (input) => {
    const cleaned = input.trim();
    if (cleaned.toLowerCase() === 'salir') {
      rl.close();
      return;
    }
    if (!cleaned) {
      prompt();
      return;
    }
    console.log('🧠 Jarvis pensando...');
    try {
      const response = await frontal.procesarPensamiento(cleaned);
      console.log(`🤖 Jarvis > ${response}\n`);
    } catch (e) {
      console.log(`❌ Error: ${e.message}\n`);
    }
    prompt();
  });
}

prompt();
