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
    if (
      (lowerText.includes('correo') || lowerText.includes('email') || lowerText.includes('inbox') || lowerText.includes('bandeja')) && 
      (lowerText.includes('revisa') || lowerText.includes('lee') || lowerText.includes('ver') || lowerText.includes('busca') || lowerText.includes('chequea') || lowerText.includes('revisar'))
    ) {
      const reply = "📥 No puedo revisar tus correos en tiempo real desde esta ventana de chat, jefe. Recuerda que la revisión, clasificación y limpieza de tu bandeja de entrada se ejecuta automáticamente en segundo plano a través de `email_processor.js` cada 8 horas.";
      addMessage(this.persona, 'assistant', reply);
      return reply;
    }

    const recuerdos = temporal.retrieve(userText, 2);
    let esContextoSensible = temporal.containsSensitiveMemory(userText, 2);
    const skills = parietal.routeSkill(userText);

    // Obtener la fecha, hora y día de la semana actual de tu computadora (Medellín/Bogotá)
    const hoy = new Date();
    const opciones = { 
      timeZone: 'America/Bogota', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    };
    const fechaColombia = new Intl.DateTimeFormat('es-CO', opciones).format(hoy);

    const systemPrompt = `Eres la Corteza Prefrontal del Life OS de Jeiser.

FECHA, HORA Y DÍA DE LA SEMANA ACTUAL DE TU COMPUTADORA (Cruza esto obligatoriamente con el calendario):
${fechaColombia}

RECUERDOS RECUPERADOS (Lóbulo Temporal):
${recuerdos || 'Ningún recuerdo histórico estrictamente relevante.'}

DIRECTRICES ACTIVAS (Lóbulo Parietal):
${skills}

REGLAS DE OPERACIÓN:
1. Responde de forma ultra-directa.
2. Si el usuario te da una orden, ejecútala mentalmente o guía el proceso usando tus herramientas.
3. Evita cualquier adulación (Anti-Sycophancy).
4. IMPORTANTE (Saludo): Si el mensaje del usuario es solo un saludo o charla casual (como 'hola', 'cómo estás'), responde directamente de forma corta sin llamar a ninguna herramienta. Solo usa herramientas cuando sea estrictamente necesario para cumplir una orden o responder una pregunta factual.
5. IMPORTANTE (Recomendaciones y Agenda): Si el usuario te pregunta qué hacer hoy, te pide recomendaciones, te dice que va a salir de casa, que va a trabajar en Didi o similar, estás OBLIGADO a invocar la herramienta "calendario" con la acción "proximos" para consultar su agenda real antes de redactar tu respuesta. No asumas ni inventes su itinerario basándote en perfiles estáticos de texto.`;

    // ── FIX-010: Forzar sensitive=true si el prompt consolidado contiene PII ──
    // Aunque el input del usuario no sea sensible, las skills inyectadas
    // (tributaria, tránsito) contienen datos personales reales (CC, placas, deudas).
    if (!esContextoSensible) {
      const textoCompleto = (systemPrompt + ' ' + userText).toLowerCase();
      // Patrones de PII: cédula (8-10 dígitos), placas colombianas (ABC123)
      const tieneCC = /\b\d{8,10}\b/.test(textoCompleto);
      const tienePlaca = /\b[A-Z]{3}\d{3}\b/.test(textoCompleto);
      // Skills que contienen PII en sus directrices
      const skillSensible = /tributaria|transito/i.test(skills);
      if (tieneCC || tienePlaca || skillSensible) {
        esContextoSensible = true;
        console.log('[Frontal] 🔒 PII detectada en prompt consolidado → forzando sensitive=true');
      }
    }

    addMessage(this.persona, 'user', userText);
    let workingMemory = getHistory(this.persona, 6);

    console.log('[Frontal] Conectando con LLM para procesar respuesta...');
    
    try {
      // Loop de Tool Calling (máx 3 iteraciones para evitar loops infinitos)
      for (let i = 0; i < 3; i++) {
        const response = await askLLM(systemPrompt, workingMemory, 0.3, toolsDefinition, esContextoSensible);
        
        if (response.tool_calls) {
          // Agregar la respuesta del asistente con las llamadas a herramientas
          workingMemory.push({ role: 'assistant', content: response.content || '', tool_calls: response.tool_calls });
          
          // Ejecutar cada herramienta
          for (const toolCall of response.tool_calls) {
            console.log(`[Frontal] 🛠️  Ejecutando herramienta nativa: ${toolCall.function.name}`);

            let toolResult;
            try {
              const args = JSON.parse(toolCall.function.arguments);
              toolResult = await executeTool(toolCall.function.name, args);
            } catch (parseError) {
              console.error(`[Frontal] ⚠️ Argumentos inválidos para ${toolCall.function.name}: ${parseError.message}`);
              toolResult = `Error: argumentos de la herramienta '${toolCall.function.name}' no son JSON válido (${parseError.message}).`;
            }

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
