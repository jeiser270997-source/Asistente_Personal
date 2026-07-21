# 🗂️ Scripts Archivados — LifeOS

> Archivos que ya no se usan en el flujo canónico. Se mantienen por referencia.
> Limpieza realizada: 2026-07-21

## batch/

| Archivo | Razón de archivo |
|---------|-----------------|
| `run_brain.bat` | Legacy — abría CMD, reemplazado por `node scripts/session.js` |
| `auto_sync.bat` | Peligroso — hacía `git push` automático sin supervisión |
| `compress_brain.bat` | Hardcoded a `C:\Users\dev\`, Headroom no se usa |

## powershell/

| Archivo | Razón de archivo |
|---------|-----------------|
| `act_runner.ps1` | No se usa — `act` no está instalado, GitHub Actions local abandonado |
| `gemini_free_tier_tracker.ps1` | Bugs de sintaxis (`[ordereddictionary]`, `Measure-Average`), loop infinito, no funcionaba |

## scripts/

| Archivo | Razón de archivo |
|---------|-----------------|
| `set_alarms.ts` | ADB no configurado en esta PC, alarmas se ponen manualmente |
| `daily_routine.js` | Legacy — redirigía a `morning_wake.js`. Reemplazado por `npm run morning` |
| `telegram_listener.js` | Bot bidireccional eliminado. LifeOS ahora solo envía mensajes vía `sendTelegramMessage()` |

## Flujo canónico actual

```bash
npm run morning              # 5am wake → briefing Telegram → sleep
npm run session              # cuando te sientas (scrapers + briefing)
npm run session -- --fast    # solo briefing
```
