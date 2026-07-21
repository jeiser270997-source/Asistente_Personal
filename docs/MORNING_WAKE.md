# Despertar (PC en sleep)

## Estado actual (Jul 2026 — post-limpieza)

| Tarea | Hora | Script | 
|-------|------|--------|
| **LifeOS_MorningRoutine** | **5:00 AM** | `morning_wake.js` (lean, sin LLM) ✅ |
| **LifeOS_PreDepartureRoutine** | **8:15 AM** | `morning_wake.js` (briefing DiDi) ✅ |

**Tareas zombies eliminadas:** `LifeOS_Brain_Morning`, `LifeOS_BrainOrchestrator`, `LifeOS_Brain_Correos`, `LifeOS_DailyAlert`, `LifeOS_AgentHeartbeat`, `Jeiser_Brain_Orchestrator`

**PM2:** Vacío (0 procesos). Ya no hay daemons.
**Scripts legacy:** Archivados en `_archived/`.
**Telegram:** Unidireccional (solo envía mensajes).

## Flujo canónico

```bash
npm run morning              # 5am (Task Scheduler) / 8:15am → briefing → sleep
npm run session              # cuando te sientas (scrapers + briefing)
```

## Por qué el clima ya no miente

Antes se usaba `precipitation_probability_max` del **día entero**. A las 5am el modelo podía decir "100% lluvia hoy" aunque estuviera soleado.

**Ahora (Open-Meteo, gratis, sin key):**
- **AHORA** — temp, código, si está lloviendo
- **Próximas 6h** — probabilidad por hora
- **Tarde 12–18h** — separado

## Qué info da el wake (sin LLM)

- 🌤️ Clima ahora + próximas 6h (Open-Meteo)
- 🚗 Pico y placa KEW496 + SIMIT desde cache
- 📰 TRM + Hacker News top post
- 🚕 Estrategia DiDi (tráfico TomTom si hay API, sino heurística)
- 📋 SENA críticos desde alertas + cola de empleo
- 🎯 Plan del día

## Actualizar Task Scheduler (una vez en PC nuevo)

```powershell
# Como Admin:
cd E:\PROYECTOS\Mis_Proyectos\Asistente_Personal
powershell -ExecutionPolicy Bypass -File scripts\setup_wakeup_routine.ps1 -UnregisterExisting
```

O manual: `taskschd.msc` → crear tarea → `node.exe scripts\morning_wake.js`
- ✅ Reactivar el equipo
- ✅ Sin límite de tiempo

## Sesión diurna

```bash
npm run session              # scrapers + organización + briefing
npm run session -- --fast    # solo briefing
```

---
*Última actualización: 2026-07-21 · Post-limpieza (PM2 vacío, scripts archivados, Telegram unidireccional)*