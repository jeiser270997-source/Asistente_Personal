const temporal = require('./temporal');
const parietal = require('./parietal');
const { getHistory, addMessage } = require('../memory/memory');
const { askLLM } = require('../ai/llm_service');

class LobuloFrontal {
  constructor() {
    this.persona = 'jeiser_brain';
  }

  async procesarPensamiento(userText) {
    console.log('[Frontal] Analizando input del usuario...');

    // 1. Extraer memoria a largo plazo relevante (Lóbulo Temporal)
    const recuerdos = temporal.retrieve(userText, 2);
    
    // 2. Cargar habilidades necesarias (Lóbulo Parietal)
    const skills = parietal.routeSkill(userText);

    // 3. Construir Prompt ultra-eficiente
    const systemPrompt = `Eres la Corteza Prefrontal del Life OS de Jeiser.

RECUERDOS RECUPERADOS (Lóbulo Temporal):
${recuerdos || 'Ningún recuerdo histórico estrictamente relevante.'}

DIRECTRICES ACTIVAS (Lóbulo Parietal):
${skills}

REGLAS DE OPERACIÓN:
1. Responde de forma ultra-directa.
2. Si el usuario te da una orden, ejecútala mentalmente o guía el proceso.
3. Evita cualquier adulación (Anti-Sycophancy).`;

    // 4. Memoria de Trabajo (Corto Plazo)
    addMessage(this.persona, 'user', userText);
    const workingMemory = getHistory(this.persona, 6); // Solo los últimos 6 mensajes para no saturar

    console.log('[Frontal] Conectando con LLM para procesar respuesta...');
    
    // 5. Ejecutar Inferencia
    try {
      const response = await askLLM(systemPrompt, workingMemory, [], 0.3);
      addMessage(this.persona, 'assistant', response.content);
      return response.content;
    } catch (error) {
      console.error('[Frontal] Colapso neuronal:', error.message);
      return `❌ Error en el Lóbulo Frontal: ${error.message}`;
    }
  }
}

module.exports = new LobuloFrontal();
