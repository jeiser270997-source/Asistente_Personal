# Despertar 5:00 AM (PC en sleep)

## Qué tienes hoy (diagnosticado en tu PC)

| Tarea | Hora | Qué corre | Problema |
|-------|------|-----------|----------|
| **LifeOS_MorningRoutine** | **5:00** | `daily_routine.js` (antes pesado + apagaba) | Scrapers + LLM free-tier + clima “día completo” |
| LifeOS_Brain_Morning | 6:30 | `run_brain.bat` → brain_orchestrator | Ruta vieja, last result error |
| LifeOS_BrainOrchestrator ×3 | 6/13/20 | brain_orchestrator | Ruido |
| LifeOS_Brain_Correos ×3 | 8/12/17 | run_brain.bat | Duplicado |
| LifeOS_DailyAlert | 7:00 | ? | Extra |

**Recomendación:** deja **solo** `LifeOS_MorningRoutine` → `morning_wake.js`. Desactiva el resto si no los usas.

## Por qué el clima mentía

Antes se usaba `precipitation_probability_max` del **día entero** + weathercode diario.  
A las 5am el modelo puede decir “100% lluvia hoy” aunque **ahora** esté soleado (la lluvia es a la tarde).

**Ahora (Open-Meteo, gratis, sin key):**
- **AHORA** — current: temp, código, si está lloviendo
- **Próximas 6h** — probabilidad por hora
- **Tarde 12–18h** — separado
- El “máx del día” solo como referencia, no como veredicto

## Por qué fallaban las APIs free

- LLM (OpenRouter/Groq/etc.): 402/429/tokens → el wake **ya no depende del LLM**
- TomTom: key opcional; si no hay, heurística de picos DiDi (no inventa minutos)
- Scrapers Playwright a las 5am post-sleep: lentos/fallan → **fuera del default**

## Comando canónico 5am

```bash
node scripts/morning_wake.js
# o
npm run morning
```

Flags:
- `--full` — también email + sena tracker (con timeout)
- `--llm` — intenta embellecer (si free-tier truena, se ignora)
- `--shutdown` — apagar PC (opt-in; **default no apaga**)

## Actualizar Task Scheduler

Como Admin:

```powershell
cd E:\PROYECTOS\Mis_Proyectos\Asistente_Personal   # o tu ruta real
# tras git pull
powershell -ExecutionPolicy Bypass -File scripts\setup_wakeup_routine.ps1 -UnregisterExisting
```

O edita la tarea `LifeOS_MorningRoutine`:
- Programa: `node.exe`
- Argumentos: `scripts\morning_wake.js`
- Inicio en: carpeta del repo **con .env**
- Wake to run: ON
- **No** “stop if runs longer than…” demasiado corto (mín 30 min)

## Qué info necesitas a las 5am (perfil Jeiser)

| Sí | No |
|----|-----|
| Clima **ahora** + si llueve en la mañana DiDi | “Día lluvioso” genérico del máximo diario |
| Pico y placa KEW496 | Tráfico inventado sin API |
| SIMIT desde cache | Scrape DIAN completo |
| SENA críticos desde alertas | Auto-apply empleo |
| Plan: DiDi AM / bloque calor / CESDE sáb | Regaños largos de LLM |
| Telegram corto | Apagar PC sin que lo pidas |

## Sesión diurna (cuando te sientas)

```bash
npm run session
```

Ahí sí scrapers y organización completa.
