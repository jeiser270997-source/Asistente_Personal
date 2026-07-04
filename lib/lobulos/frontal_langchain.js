require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { ChatOpenAI } = require("@langchain/openai");
const { AgentExecutor, createToolCallingAgent } = require("langchain/agents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { temporalTool } = require("./temporal_langchain");
const { parietalTool } = require("./parietal_langchain");
const { getHistory, addMessage } = require('../memory');

class LobuloFrontalLangChain {
  constructor() {
    this.persona = 'jeiser_brain';
    
    // Inicializar el LLM de LangChain usando OpenRouter o Groq
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 
                   (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined);
    
    if (!apiKey) {
      console.warn("⚠️ [Frontal] No se detectaron API Keys para inicializar LangChain. Funcionalidad limitada.");
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey || 'dummy-key',
      configuration: { baseURL },
      modelName: process.env.OPENROUTER_API_KEY ? "google/gemini-2.5-flash-free" : "llama-3.3-70b-versatile",
      temperature: 0.1
    });

    this.tools = [temporalTool, parietalTool];

    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", "Eres la Corteza Prefrontal del Life OS de Jeiser. Tienes acceso a herramientas de LangChain para recuperar memoria a largo plazo (temporalTool) y cargar reglas de personalidad/skills (parietalTool). Úsalas SIEMPRE que necesites contexto antes de responder. Sé ultraconciso."],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"]
    ]);

    this.agent = createToolCallingAgent({
      llm: this.llm,
      tools: this.tools,
      prompt: this.prompt
    });

    this.executor = new AgentExecutor({
      agent: this.agent,
      tools: this.tools,
      verbose: true // Para ver cómo "piensa" el agente en consola
    });
  }

  async procesarPensamiento(userText) {
    console.log('[Frontal-LangChain] Activando red neuronal con herramientas...');
    
    // Obtener historial corto
    const history = getHistory(this.persona, 4).map(m => {
      return [m.role === 'user' ? 'human' : 'ai', m.content];
    });

    try {
      const result = await this.executor.invoke({
        input: userText,
        chat_history: history
      });

      addMessage(this.persona, 'user', userText);
      addMessage(this.persona, 'assistant', result.output);
      
      return result.output;
    } catch (error) {
      console.error('[Frontal-LangChain] Colapso en AgentExecutor:', error.message);
      return `❌ Error en LangChain Frontal: ${error.message}`;
    }
  }
}

module.exports = new LobuloFrontalLangChain();
