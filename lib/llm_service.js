require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { isDeepSeekValley } = require('./time_scheduler');

const PROVIDERS = [
  { name: 'DeepSeek V4 Flash', url: 'https://api.deepseek.com/v1/chat/completions', key: process.env.DEEPSEEK_API_KEY, models: ['deepseek-v4-flash'], paid: true },
  { name: 'Cerebras (Ultra Fast)', url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY || process.env.PROVIDER_1_API_KEY, models: ['llama3.1-70b'] },
  { name: 'Groq (Fast Cloud)', url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
  { name: 'NVIDIA (NIM Cloud)', url: 'https://integrate.api.nvidia.com/v1/chat/completions', key: process.env.NVIDIA_API_KEY || process.env.PROVIDER_2_API_KEY, models: ['meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct'] },
  { name: 'Gemini (Google)', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', key: process.env.GEMINI_API_KEY, models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
  { name: 'OpenRouter (Free Cloud)', url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY || process.env.PROVIDER_3_API_KEY, models: ['google/gemini-2.5-flash-free', 'qwen/qwen-2.5-coder-32b-instruct:free', 'meta-llama/llama-3.1-8b-instruct:free'] },
  { name: 'Ollama (Local Fallback)', url: (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/v1').replace(/\/+$/, '') + '/chat/completions', key: 'local', models: ['qwen2.5-coder:latest', 'llama3.1:latest', 'llama3.2:latest'] }
];

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function askLLM(systemPrompt, messages, tools = [], temperature = 0.1) {
  const valley = isDeepSeekValley();
  const activeProviders = PROVIDERS.filter(p => {
    if (!p.key || p.key === 'undefined') return false;
    if (p.paid && !valley) return false;
    return true;
  });
  if (activeProviders.length === 0) throw new Error("No tienes ningún proveedor de IA configurado en tu archivo .env");

  for (const provider of activeProviders) {
    for (const model of provider.models) {
      let attempts = 3;
      let delay = 1500;

      while (attempts > 0) {
        try {
          console.log(`🧠 Evaluando: ${provider.name} | Modelo: ${model} (Intentos: ${attempts}/3)...`);
          const headers = { 'Content-Type': 'application/json' };
          if (provider.key !== 'local') headers['Authorization'] = `Bearer ${provider.key}`;

          const body = {
            model: model,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            temperature: temperature
          };

          const supportsTools = model.includes('gemini') || model.includes('70b') || model.includes('qwen') || model.includes('llama') || model.includes('nemotron');
          if (tools.length > 0 && supportsTools) {
            body.tools = tools;
          }

          // TIMEOUT AUMENTADO A 45s PARA ESTABILIDAD DE OLLAMA Y APIS
          const response = await fetch(provider.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(45000)
          });

          if (response.status === 429) {
            console.warn(`⚠️ Rate Limit (429) en ${provider.name}. Reintentando en ${delay}ms...`);
            await sleep(delay);
            delay *= 2;
            attempts--;
            continue;
          }

          if (!response.ok) throw new Error(`HTTP ${response.status} - ${await response.text()}`);

          const data = await response.json();
          if (data.choices && data.choices[0].message) {
            console.log(`✅ Conexión establecida con éxito con ${provider.name} [${model}]`);
            return data.choices[0].message;
          }
        } catch (error) {
          console.error(`❌ Intento fallido para ${provider.name} [${model}]: ${error.message.substring(0, 100)}`);
          attempts--;
          if (attempts > 0) await sleep(1000);
        }
      }
    }
  }
  throw new Error("❌ Crítico: Todos los proveedores, modelos secundarios y reintentos automáticos fallaron.");
}

module.exports = { askLLM };
