# Free tiers para OmniRoute (ampliar cupo vs OpenRouter solo)

OpenRouter free se agota fácil. Añade **cuentas propias** en OmniRoute (dashboard local) y usa combos `auto/cheap` / `auto/best-free` / `auto/coding`.  
LifeOS ya apunta a `http://localhost:20128` — no hace falta duplicar keys en LifeOS.

## Prioridad alta (útiles + fáciles)

| # | Proveedor | Por qué | Dónde sacar key |
|---|-----------|---------|-----------------|
| 1 | **Groq** | Muy rápido, free diario generoso | https://console.groq.com |
| 2 | **Google AI Studio (Gemini)** | Flash free, buen contexto | https://aistudio.google.com/apikey |
| 3 | **Cerebras** | Rápido, free tier | https://cloud.cerebras.ai |
| 4 | **SambaNova** | Llama free | https://cloud.sambanova.ai |
| 5 | **DeepSeek** | Barato/free credits a veces; buen coding | https://platform.deepseek.com |
| 6 | **Mistral (La Plateforme)** | Free experiment / trial | https://console.mistral.ai |
| 7 | **Together.ai** | Créditos signup | https://api.together.xyz |
| 8 | **Fireworks** | Free credits | https://fireworks.ai |
| 9 | **OpenRouter** | Ya lo tienes — déjalo como un proveedor más del pool | https://openrouter.ai |
| 10 | **GitHub Models** | Free limitado con cuenta GH | https://github.com/marketplace/models |
| 11 | **Cloudflare Workers AI** | Free tier diario | https://developers.cloudflare.com/workers-ai |
| 12 | **Hugging Face Inference** | Free rate-limited | https://huggingface.co/settings/tokens |
| 13 | **Cohere** | Trial free | https://dashboard.cohere.com |
| 14 | **AI21** | Credits signup | https://studio.ai21.com |
| 15 | **NVIDIA NIM / build.nvidia.com** | Free endpoints | https://build.nvidia.com |

## Coding / agentes (para OmniRoute `auto/coding`)

| Proveedor | Notas |
|-----------|--------|
| DeepSeek | Chat + coder |
| Groq (Llama 3.3 / Qwen) | Velocidad |
| Gemini 2.5 Flash | Contexto largo |
| Cerebras | Iteraciones rápidas |
| OpenRouter free models | Solo como backup del pool |

## Cómo sumarlos en OmniRoute

1. Abre el dashboard OmniRoute (local).
2. **Providers / API keys** → añade cada key.
3. Verifica health por proveedor.
4. Deja el modelo de LifeOS/agente en:
   - `auto/cheap` o `auto/best-free` (diario)
   - `auto/coding` (agente de código)
5. **No** copies las mismas keys otra vez a LifeOS `.env` si OmniRoute ya las tiene (doble gasto de cupo).

## Qué NO meter al wake 5am

El wake **no usa** OmniRoute. Solo clima + Telegram.  
OmniRoute = cuando **tú** abres el agente o un script con LLM.

## Checklist “más cupo que OpenRouter”

- [ ] Groq  
- [ ] Gemini (Google AI Studio)  
- [ ] Cerebras  
- [ ] SambaNova  
- [ ] DeepSeek  
- [ ] Mistral  
- [ ] Together o Fireworks  
- [ ] OpenRouter (ya) como un nodo del pool  

Con 4–5 de la lista alta, `auto/cheap` suele aguantar mucho más que OpenRouter solo.

## Referencia

- Repo: https://github.com/diegosouzapw/OmniRoute  
- Free tiers doc del proyecto: su `docs/reference/FREE_TIERS.md`  
- LifeOS: `docs/OMNIROUTE.md`
