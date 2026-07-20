# Sesión LifeOS (on-demand)

## ¿Para qué servía PM2?

PM2 mantiene procesos **siempre vivos** (bot Telegram, crons cada X horas). Sirve si la PC está 24/7.  
**Tú no la dejas prendida** → PM2 sobra y molesta (restarts, CPU, confusión).

## Qué usar en su lugar

```bash
# Al sentarte (mañana o noche)
npm run session

# Solo el resumen del día (rápido)
npm run session:fast
```

| Paso de `session` | Qué hace |
|-------------------|----------|
| Correo | Clasifica/inbox |
| SENA | Scraper + tracker |
| SIMIT | Multas cache |
| DIAN | Solo lunes |
| Empleo | Scrape + cola; **no postula** |
| Vehículo | Recordatorios |
| Briefing | Consola + Telegram opcional |

## Briefing: ¿está bien?

Mejorado para tu contexto real:

1. **Prioridad:** SENA/CESDE primero (sábado = CESDE 7:30–18:00).  
2. **DiDi:** bloques AM/PM + **no conducir 10:30–15:30** (calor).  
3. **Empleo:** cola semi-auto, no auto-apply.  
4. **SIMIT + moto:** no circular BXU28C.  
5. **Sin LLM:** igual genera briefing (fallback).  
6. **Calendar:** no sincroniza por defecto (menos fricción).

## Apagar basura PM2

```bash
pm2 kill
```

No vuelvas a `pm2 start` salvo que quieras un bot 24/7 a propósito.
