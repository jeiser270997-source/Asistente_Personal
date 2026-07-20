# Operación con agentes (DeepSeek V4 Flash + tools)

> Actualizado 2026-07-20 · LifeOS single-tenant

## ¿Es viable?

**Sí, con frenos.** El repo está optimizado para *mantenimiento asistido por agente*, no para re-arquitectura autónoma continua.

| Capacidad | Estado | Notas |
|-----------|:------:|-------|
| Contrato legible (`AGENTS.md`) | ✅ | Principios, PM2, semi-auto, anti-ciclo |
| Paths canónicos | ✅ | `lib/data/paths.js` |
| Tests de regresión | ✅ | 114+ tests; política jobs cubierta |
| Fail-closed jobs/LLM | ✅ | score 0 si LLM cae; apply solo con `--auto` |
| Runtime audit paths | ✅ | `npm run runtime:ci` |
| Scrapers auto-reparables siempre | ⚠️ | Sitios cambian; agente puede retocar selectores |
| Auditoría infinita | ❌ | Prohibido por principio 8 |

## Filtro anti-ciclo vicioso

```
¿Hay síntoma? (error, test rojo, alerta real, requisito nuevo de Jeiser)
  SÍ → diagnosticar → fix mínimo → npm test → commit
  NO → STOP. Es mantenimiento diferible. No abrir ronda de audit.
```

**Síntomas válidos:** proceso PM2 en error, scraper 0 resultados inesperados, test fallando, correo mal clasificado, apply en LIVE sin querer.

**No son síntomas:** "score de audit bajo", "falta una lib de moda", "podría ser más clean architecture".

## Prompt corto recomendado (DeepSeek + tools)

```
Lee AGENTS.md. Principio 8: si no está roto, no audites.
Síntoma: [pegar error / log / test].
Arregla solo eso. Corre npm test. No refactorices fuera del scope.
No pongas --auto en ecosystem. No toques .env secrets en docs.
```

## Comandos del agente

```bash
npm test
npm run runtime:ci
node scripts/jobs/computrabajo_apply.js --dry-run   # no postula
node scripts/diagnostics/healthcheck.js             # si existe en host
```

## Límites de DeepSeek V4 Flash como coding agent

- Bueno: fixes locales, tests, JSON de reglas, selectores, docs.
- Riesgo: inventar APIs, tocar demasiados archivos, "mejorar" sin bug.
- Mitigación: scope explícito + `npm test` obligatorio + no merge sin gate.

## Relación con horario valle DeepSeek (runtime LifeOS)

El *llm_service* de producción prefiere DeepSeek en valle (11pm–8am COT).  
El *agente de coding* (OpenCode/Cursor/etc. con modelo DeepSeek) es otro canal: úsalo cuando quieras; no confunde con las llamadas LLM de scrapers/email.
