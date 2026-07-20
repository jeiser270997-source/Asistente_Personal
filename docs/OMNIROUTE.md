# OmniRoute + LifeOS

## Qué es

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) = **un solo endpoint local** que enruta a decenas de free tiers (DeepSeek, Groq, Gemini, Cerebras, etc.) con auto-fallback cuando se acaba el cupo.

En tu PC ya corre en:

```
http://localhost:20128/v1
```

(Config/datos: `%APPDATA%\omniroute\`)

## ¿Mejora LifeOS?

| Caso | ¿Usar OmniRoute? |
|------|------------------|
| **Wake 5am** (clima, PyP, Telegram) | **No** — no hace falta LLM |
| **Correo automático** | **No** por defecto (reglas). Opt-in `EMAIL_USE_LLM=true` |
| **Agente DeepSeek / coding** | **Sí** — apunta el agente a OmniRoute o usa `auto/coding` |
| **Scoring empleo / briefing con IA** | **Sí** si OmniRoute está up (fallback automático de free tiers) |
| **Calendar** | No — desactivado, alarmas manuales |

**Resumen:** OmniRoute no sustituye el wake lean. Sí arregla el dolor de “API free se cayó / 402 tokens” cuando *sí* quieres LLM en LifeOS o en el agente.

## Integración hecha en LifeOS

`lib/ai/litellm_client.js` prioriza:

1. **OmniRoute** `:20128` con modelo `OMNIROUTE_MODEL` (default `auto/cheap`)
2. LiteLLM `:4000` (legacy)
3. Keys directas solo si OmniRoute **no** responde (evita quemar free tier dos veces)

### Variables `.env` (LifeOS)

```env
OMNIROUTE_URL=http://localhost:20128
OMNIROUTE_API_KEY=omniroute
OMNIROUTE_MODEL=auto/cheap
OMNIROUTE_MODEL_CODING=auto/coding
EMAIL_USE_LLM=false
```

Modelos útiles de OmniRoute:

| Modelo | Uso |
|--------|-----|
| `auto/cheap` | Default LifeOS (barato/free) |
| `auto/best-free` | Solo free |
| `auto/coding` | Código / agente |
| `auto/fast` | Baja latencia |
| `auto/smart` | Mejor calidad |

## Cómo usarlo en el agente (DeepSeek / OpenCode / Cursor)

Base URL OpenAI-compatible:

```
http://localhost:20128/v1
```

API key: la que tengas en OmniRoute (o `omniroute` si no exige key).  
Modelo: `auto/coding` o `auto/cheap`.

Así el agente **también** se beneficia del fallback de free tiers sin tocar LifeOS.

## Flujo Jeiser (sin contradicciones)

```
5am:  PC sleep → morning_wake → Telegram → sleep
      (Open-Meteo + PyP + caches — sin OmniRoute)

Tú despiertas / te sientas:
  · Agente + OmniRoute (DeepSeek/auto/coding) → estudio, correos, código
  · npm run session  (opcional, scrapers)
  · Alarmas: manuales (no Calendar LifeOS)
```

## Probar

```bash
# ¿OmniRoute vivo?
curl http://localhost:20128/v1/models

# Desde LifeOS
node -e "require('./lib/ai/litellm_client').omniRouteHealth().then(console.log)"
node -e "require('./lib/ai/llm_service').askLLM('Di OK','',0.1).then(r=>console.log(r.content)).catch(e=>console.error(e.message))"
```

## Qué NO hacer

- Meter OmniRoute al wake 5am (innecesario, puede fallar post-sleep si el gateway no está).
- `EMAIL_USE_LLM=true` + sensitive a free tiers sin leer el riesgo de PII.
- Duplicar las mismas keys en LifeOS **y** OmniRoute y llamar ambos a la vez (quema cupo).
