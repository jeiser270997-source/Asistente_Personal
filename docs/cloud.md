# Cloud Deployment — HISTÓRICO (Jul 2026)

> **⚠️ Histórico:** Esta documentación describe la arquitectura anterior basada en GitHub Actions.
> Los 13 workflows GHA fueron eliminados el 15/07/2026 durante el deep audit.
> Ver `ecosystem.config.js` para la arquitectura actual (PM2 local).

## Arquitectura anterior (hasta Jul 2026)

GitHub Actions con cron como runtime. 13 workflows en ubuntu-22.04.
La DB se restauraba/guardaba usando `actions/cache`.

## Arquitectura actual (local-first con PM2)

```
🖥️ Windows / Linux local
       │
  PM2 (ecosystem.config.js)
       │
  ├── jarvis-telegram        → daemon (always-on)
  ├── brain-orchestrator     → cron 7am
  ├── context-engine-daily   → cron 6am
  ├── morning-briefing       → cron 7am
  ├── email-cleaner          → cron cada 3h
  ├── inbox-sensor           → cron */15 min
  ├── sena-scraper           → cron lun-vie 6am
  ├── simit-checker          → cron diario 7am
  ├── dian-scraper           → cron lunes 9am
  ├── computrabajo-scraper   → cron lun-vie 8am
  ├── computrabajo-apply     → cron lun-vie 9am
  ├── healthcheck            → cron diario 8am
  ├── recordatorio-deepseek  → cron 3x dia
  ├── document-pipeline      → cron diario 9am
  ├── vehicle-manager        → cron diario 6am
  ├── backup-dbs             → cron diario 11pm
  └── job-loop               → cron lun-vie 10am
       │
       ▼
  SQLite (data/*.db) + JSON (data/state/)
```

## Comandos rápidos PM2

```bash
# Arrancar todo
pm2 start ecosystem.config.js

# Ver estado
pm2 status
pm2 logs

# Recargar config después de cambios
pm2 start ecosystem.config.js --update-env

# Detener todo
pm2 stop ecosystem.config.js

# Ver logs de un proceso específico
pm2 logs brain-orchestrator

# Dashboard en tiempo real
pm2 monit
```

## Requisitos del entorno local

| Recurso | Detalle |
|---------|---------|
| Node.js | >= 18 |
| npm | `npm ci` para instalar dependencias |
| `.env` | Copiar `.env.example` → `.env` con secrets reales |
| PM2 | `npm install -g pm2` |
| Playwright | `npx playwright install chromium` (para scrapers) |
| DBs | Litestream restore o `node runtime/migrate.js` |
