const temporal = require('./temporal');
const parietal = require('./parietal');
const { getHistory, addMessage } = require('../memory/memory');
const { askLLM } = require('../ai/llm_service');
const { toolsDefinition, executeTool } = require('./tools');

class LobuloFrontal {
  constructor() {
    this.persona = 'jeiser_brain';
  }

  async procesarPensamiento(userText) {
    console.log('[Frontal] Analizando input del usuario...');

    const lowerText = userText.toLowerCase();

    // ── GURDAIL DETERMINÍSTICO (Principio #1: Regla antes que IA) ──
    // Si el usuario pide revisar correos, interceptamos de inmediato sin gastar tokens ni llamar al LLM
    if (
      (lowerText.includes('correo') || lowerText.includes('email') || lowerText.includes('inbox') || lowerText.includes('bandeja')) && 
      (lowerText.includes('revisa') || lowerText.includes('lee') || lowerText.includes('ver') || lowerText.includes('busca') || lowerText.includes('chequea') || lowerText.includes('revisar'))
    ) {
      const reply = "📥 No puedo revisar tus correos en tiempo real desde esta ventana de chat, jefe. Recuerda que la revisión, clasificación y limpieza de tu bandeja de entrada se ejecuta automáticamente en segundo plano a través de `email_processor.js` cada 8 horas.";
      addMessage(this.persona, 'assistant', reply);
      return reply;
    }

    const recuerdos = temporal.retrieve(userText, 2);
    const skills = parietal.routeSkill(userText);

    const systemPrompt = `Eres la Corteza Prefrontal del Life OS de Jeiser.

RECUERDOS RECUPERADOS (Lóbulo Temporal):
${recuerdos || 'Ningún recuerdo histórico estrictamente relevante.'}

DIRECTRICES ACTIVAS (Lóbulo Parietal):
${skills}

REGLAS DE OPERACIÓN:
1. Responde de forma ultra-directa.
2. Si el usuario te da una orden, ejecútala mentalmente o guía el proceso usando tus herramientas.
3. Evita cualquier adulación (Anti-Sycophancy).
4. IMPORTANTE (Saludo): Si el mensaje del usuario es solo un saludo o charla casual (como 'hola', 'cómo estás'), responde directamente de forma corta sin llamar a ninguna herramienta. Solo usa herramientas cuando sea estrictamente necesario para cumplir una orden o responder una pregunta factual.`;

    addMessage(this.persona, 'user', userText);
    let workingMemory = getHistory(this.persona, 6);

    console.log('[Frontal] Conectando con LLM para procesar respuesta...');
    
    try {
      // Loop de Tool Calling (máx 3 iteraciones para evitar loops infinitos)
      for (let i = 0; i < 3; i++) {
        const response = await askLLM(systemPrompt, workingMemory, 0.3, toolsDefinition);
        
        if (response.tool_calls) {
          // Agregar la respuesta del asistente con las llamadas a herramientas
          workingMemory.push({ role: 'assistant', content: response.content || '', tool_calls: response.tool_calls });
          
          // Ejecutar cada herramienta
          for (const toolCall of response.tool_calls) {
            console.log(`[Frontal] 🛠️ Ejecutando herramienta: ${toolCall.function.name}`);
            const args = JSON.parse(toolCall.function.arguments);
            const toolResult = await executeTool(toolCall.function.name, args);
            
            // Agregar el resultado al historial
            workingMemory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: String(toolResult)
            });
          }
        } else {
          // Respuesta final
          addMessage(this.persona, 'assistant', response.content);
          return response.content;
        }
      }
      return "❌ Se alcanzó el límite de iteraciones de herramientas.";
    } catch (error) {
      console.error('[Frontal] Colapso neuronal:', error.message);
      return `❌ Error en el Lóbulo Frontal: ${error.message}`;
    }
  }
}

module.exports = new LobuloFrontal();
