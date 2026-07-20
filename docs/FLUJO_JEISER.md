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
| Limpiar / priorizar correos | Agente DeepSeek; o `email_processor.js` en **modo seguro** (solo etiquetas, **no borra**, inbox intacto). Ver abajo. |
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

### Gmail: ¿borra correos importantes?

**Default actual (fail-safe):**

| Acción | ¿Qué pasa? |
|--------|------------|
| Importante (SENA, DIAN, multa…) | Etiqueta + ⭐ estrella. **Sigue en inbox** |
| Bajo señal / “basura” | Etiqueta `LifeOS/BajoSenal`. **No trash, sigue en inbox** |
| Postulación Computrabajo | Etiqueta `Trabajo/Postulaciones`. **Ya no va a papelera** |
| Borrado permanente | **Nunca** (`users.messages.delete` no se usa) |

Opt-in agresivo (solo si lo pides):
- `EMAIL_INBOX_ZERO=true` — saca de bandeja al etiquetar  
- `EMAIL_ALLOW_TRASH=true` — permite papelera (recuperable 30 días)  
- `EMAIL_USE_LLM=true` — resúmenes con OmniRoute/LLM (PII: cuidado)

**OmniRoute en correo:** opcional para *resumir* mejor; **no** hace el filtrado más seguro que las reglas. El riesgo de perder mail no es el LLM, era el `trash` + sacar del inbox. Eso ya se cerró.

El **wake 5am no toca Gmail**.

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

## Gmail labels + Calendar (limpieza hecha)

```bash
npm run gmail:cleanup        # reorg labels + vaciar calendar primary
npm run gmail:cleanup:dry    # simular
```

- Etiquetas canónicas: `docs/GMAIL_LABELS.md`
- Free tiers OmniRoute (más cupo): `docs/OMNIROUTE_FREE_TIERS.md`
- Calendar primary: se vació con `calendars.clear` (Festivos Colombia no se toca)
- Etiqueta `Basura` eliminada → mails en `LifeOS/BajoSenal`
