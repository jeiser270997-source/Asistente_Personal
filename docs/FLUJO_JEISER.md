# Flujo real de Jeiser (LifeOS)

## Automático (única cosa)

```
PC en SLEEP
  → 5:00 Task Scheduler despierta
  → morning_wake.js
       · clima AHORA (Open-Meteo, gratis, sin key)
       · pico y placa (pico_placa.json)
       · caches SENA/SIMIT/empleo
       · Telegram informe
  → vuelve a SLEEP
  → (a las 2am tu otra actividad sigue pudiendo usar la máquina en sleep/wake propio)
```

```bash
npm run morning              # en la carpeta con .env
node scripts/morning_wake.js --no-sleep   # prueba sin dormir
```

## Manual (tú + agente DeepSeek)

| Quieres… | Haces… |
|----------|--------|
| Limpiar / priorizar correos | Abres agente DeepSeek + tools; o `node scripts/integrations/email_processor.js` (solo reglas, **sin LLM free-tier**) |
| Estudiar CESDE/SENA | Agente + skills tutor |
| Organizar el día | `npm run session` o solo agente |
| Postular empleo | `node scripts/jobs/job_loop.js --auto` (a mano) |
| Alarmas | **Manual** en el teléfono / reloj — Calendar LifeOS apagado |

## ¿Free-tier LLM / OmniRoute?

| Qué | Necesario |
|-----|-----------|
| **Wake 5am** | No LLM. Solo Open-Meteo + Telegram + caches |
| **Correo auto** | No LLM (`EMAIL_USE_LLM=false`). Reglas. |
| **Agente / estudio / “ayúdame con X”** | **Sí → OmniRoute** (`localhost:20128`, ya con tus APIs free) |
| LifeOS scoring/briefing con IA | Si OmniRoute está up, LifeOS lo usa solo |

Detalle: `docs/OMNIROUTE.md`

| API | ¿Para qué? |
|-----|------------|
| **OmniRoute** | Gateway de tus free tiers (agente + LLM opcional LifeOS) |
| Open-Meteo | Clima 5am (sin key) |
| Telegram | Informe matutino |
| Google Calendar | **No** — alarmas manuales |
| TomTom | Opcional |

Opt-in correo con LLM local: `EMAIL_USE_LLM=true` + LiteLLM (sensitive).

## Pico y placa (KEW496 → 6)

| Desde | Día | Horario |
|-------|-----|---------|
| **2026-08-04** | **Lunes** | **05:00–20:00** |
| Antes | Jueves (esquema viejo) | según legacy |

Archivo: `data/config/pico_placa.json`  
Código: `lib/integrations/pico_placa.js`

## Qué NO corre solo

- PM2 daemons  
- Calendar spam  
- Auto-apply empleo  
- LLM free-tier en el wake  
- Apagado de PC (usa **sleep**)  

## Basura Task Scheduler

Deja **solo** `LifeOS_MorningRoutine` → `morning_wake.js` (o `daily_routine.js` que redirige).  
Desactiva Brain_*, Correos, Heartbeat, DailyAlert, etc. (ver `docs/MORNING_WAKE.md`).
