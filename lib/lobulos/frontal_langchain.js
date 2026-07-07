require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { ChatOpenAI } = require('@langchain/openai');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const { temporalTool } = require('./temporal_langchain');
const { parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool } = require('./parietal_langchain');
const { getHistory, addMessage } = require('../memory/memory');
const fs = require('node:fs');
const path = require('node:path');

// ── Cargar contexto maestro de Jeiser ─────────────────────────
function loadEstadoVivo() {
  try {
    const p = path.join(__dirname, '..', '..', 'data', 'contexto_maestro', 'ESTADO_VIVO.md');
    return fs.readFileSync(p, 'utf8').substring(0, 1200);
  } catch { return ''; }
}

// ── Seleccionar LLM con tool-calling ──────────────────────────
function buildLLM() {
  if (process.env.DEEPSEEK_API_KEY) {
    console.log('[Frontal] LLM: deepseek-chat (tool-calling via OpenAI compat)');
    return new ChatOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: { baseURL: 'https://api.deepseek.com/v1' },
      model: 'deepseek-chat',
      temperature: 0.1,
      maxTokens: 2000,
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    console.log('[Frontal] LLM: OpenRouter gemini-2.5-flash');
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
      model: 'google/gemini-2.5-flash-free',
      temperature: 0.1,
    });
  }
  if (process.env.GROQ_API_KEY) {
    console.log('[Frontal] LLM: Groq llama-3.3-70b');
    return new ChatOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      configuration: { baseURL: 'https://api.groq.com/openai/v1' },
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });
  }
  console.warn('⚠️ [Frontal] Sin API key válida');
  return null;
}

class LobuloFrontalLangChain {
  constructor() {
    this.persona   = 'jeiser_brain';
    this.llm       = buildLLM();
    this.tools     = [temporalTool, parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool];
    this.estadoVivo = loadEstadoVivo();

    if (this.llm) {
      const systemPrompt = this._buildSystemMsg();
      this.agent = createReactAgent({
        llm: this.llm,
        tools: this.tools,
        messageModifier: new SystemMessage(systemPrompt),
      });
    }
  }

  _buildSystemMsg() {
    return `Eres la Corteza Prefrontal del Life OS de Jeiser (Colombia).

${this.estadoVivo}

REGLAS:
- Usa buscar_memoria antes de responder sobre temas personales.
- Usa load_skill para temas legales (DIAN/SIMIT), financieros, QA, trabajo o emocionales.
- Respuestas directas y cortas. Sin adulación. Corrige si está equivocado.
- scraper_web para acceder a URLs. guardar_nota para persistir info importante.`;
  }

  async procesarPensamiento(userText) {
    if (!this.agent) {
      return '❌ Frontal sin LLM configurado. Verifica API keys en .env';
    }
    console.log('[Frontal] Pensando con DeepSeek + 5 tools...');

    // Construir historial para langgraph
    const rawHistory = getHistory(this.persona, 4);
    const history = rawHistory.map(m =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    try {
      const result = await this.agent.invoke({
        messages: [...history, new HumanMessage(userText)],
      });

      // Extraer último mensaje de IA
      const msgs = result.messages || [];
      const lastAI = [...msgs].reverse().find(m => m._getType?.() === 'ai' || m.constructor?.name === 'AIMessage');
      const output = lastAI?.content || result.output || 'Sin respuesta';

      addMessage(this.persona, 'user', userText);
      addMessage(this.persona, 'assistant', output);
      return output;
    } catch (error) {
      console.error('[Frontal] Error:', error.message);
      return `❌ Frontal error: ${error.message}`;
    }
  }
}

module.exports = new LobuloFrontalLangChain();

