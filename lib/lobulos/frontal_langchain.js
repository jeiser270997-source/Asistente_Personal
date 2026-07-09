require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { ChatOpenAI } = require('@langchain/openai');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const { temporalTool } = require('./temporal_langchain');
const { parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool } = require('./parietal_langchain');
const { getHistory, addMessage } = require('../memory/memory');
const { createLangChainLLM } = require('../ai/litellm_client');
const fs = require('node:fs');
const path = require('node:path');

// ── Cargar contexto maestro de Jeiser ─────────────────────────
function loadEstadoVivo() {
  try {
    const p = path.join(__dirname, '..', '..', 'data', 'contexto_maestro', 'ESTADO_VIVO.md');
    return fs.readFileSync(p, 'utf8').substring(0, 1200);
  } catch { return ''; }
}

class LobuloFrontalLangChain {
  constructor() {
    this.persona   = 'jeiser_brain';
    this.llm       = null;
    this.agent     = null;
    this.tools     = [temporalTool, parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool];
    this.estadoVivo = loadEstadoVivo();

    // Inicialización asíncrona: arranca inmediatamente,
    // procesarPensamiento() espera a que termine.
    this.__initPromise = this._init();
  }

  async _init() {
    // 1. Intentar LiteLLM / OpenRouter / Groq vía createLangChainLLM
    try {
      const llm = createLangChainLLM({ temperature: 0.1, maxTokens: 2000 });
      if (llm) {
        console.log('[Frontal] LLM iniciado vía createLangChainLLM');
        this.llm = llm;
        this._buildAgent();
        return;
      }
    } catch (err) {
      console.warn('[Frontal] createLangChainLLM falló:', err.message);
    }

    // 2. Fallback: OpenRouter (directo)
    if (process.env.OPENROUTER_API_KEY) {
      console.log('[Frontal] Fallback: OpenRouter gemini-2.5-flash');
      this.llm = new ChatOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        configuration: { baseURL: 'https://openrouter.ai/api/v1' },
        model: 'google/gemini-2.5-flash-free',
        temperature: 0.1,
      });
      this._buildAgent();
      return;
    }

    // 3. Fallback: Groq
    if (process.env.GROQ_API_KEY) {
      console.log('[Frontal] Fallback: Groq llama-3.3-70b');
      this.llm = new ChatOpenAI({
        apiKey: process.env.GROQ_API_KEY,
        configuration: { baseURL: 'https://api.groq.com/openai/v1' },
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
      });
      this._buildAgent();
      return;
    }

    console.warn('⚠️ [Frontal] Sin API key válida');
  }

  _buildAgent() {
    if (!this.llm) return;
    const systemPrompt = this._buildSystemMsg();
    this.agent = createReactAgent({
      llm: this.llm,
      tools: this.tools,
      messageModifier: new SystemMessage(systemPrompt),
    });
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
    // Esperar inicialización asíncrona
    await this.__initPromise;

    if (!this.agent) {
      return '❌ Frontal sin LLM configurado. Verifica API keys en .env';
    }
    console.log('[Frontal] Pensando con smart-router + 7 tools...');

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

