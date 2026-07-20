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

## Actualizar Task Scheduler (hazlo una vez en el PC real)

Tu tarea actual (diagnosticada):

```
LifeOS_MorningRoutine  →  5:00 AM
  node.exe scripts\daily_routine.js
  Start in: E:\PROYECTOS\Mis_Proyectos\Asistente_Personal
```

### Opción A — script (Admin)

```powershell
cd E:\PROYECTOS\Mis_Proyectos\Asistente_Personal
git pull
npm ci
powershell -ExecutionPolicy Bypass -File scripts\setup_wakeup_routine.ps1 -UnregisterExisting
```

### Opción B — a mano (taskschd.msc)

1. Abre **Programador de tareas** → `LifeOS_MorningRoutine`
2. Acciones → Editar:
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `scripts\morning_wake.js`
   - Iniciar en: `E:\PROYECTOS\Mis_Proyectos\Asistente_Personal` (donde está el `.env`)
3. Condiciones → ☑ **Reactivar el equipo para ejecutar esta tarea**
4. Configuración → si falla, reintentar cada 10 min, hasta 2 veces

### Opción C — sin tocar la tarea

`daily_routine.js` **ya redirige** a `morning_wake.js` por defecto (salvo `--full-legacy`).  
Con `git pull` en esa carpeta, mañana a las 5am ya usa el wake lean.

### Basura de tareas a desactivar

En taskschd.msc → clic derecho → **Deshabilitar** (no borrar si no estás seguro):

| Tarea | Por qué sobra |
|-------|----------------|
| `LifeOS_Brain_Morning` | Ruta vieja / error |
| `LifeOS_BrainOrchestrator` (×3) | Ruido 6/13/20h |
| `LifeOS_Brain_Correos` (×3) | Duplicado |
| `Jeiser_Brain_Orchestrator` | Legacy |
| `LifeOS_DailyAlert` | Extra |
| `LifeOS_AgentHeartbeat` | Extra |

**Deja solo:** `LifeOS_MorningRoutine` (5am).  
Organización diurna: `npm run session` cuando te sientes.

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
