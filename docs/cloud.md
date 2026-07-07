# Cloud Deployment

Arquitectura híbrida: Jarvis corre en GitHub Actions (cron cada 5 min), almacenamiento en cache entre runs.

## Workflows

| Workflow | Schedule | Trigger |
|----------|----------|---------|
| `jarvis.yml` | `*/5 * * * *` | Thinking loop + decisión |
| `runtime-audit.yml` | on PR/push | Guardrail CI |
| *(futuro)* `context-daily.yml` | `0 6 * * *` | Context Engine diario |

## Persistencia

GitHub Actions no tiene filesystem persistente. La DB se restaura/guarda usando `actions/cache`:

```
runtime/lifeos.db
    │
    ├── restore: desde última cache disponible
    ├── jarvis_loop: lee/escribe
    └── persist: guarda con key=lifeos-db-${{ github.run_id }}
```

Límites del cache gratuito:
- 10 GB por repo
- 7 días de retención
- ~2-3 minutos por salvar/restaurar

## Secrets requeridos

| Secret | Origen |
|--------|--------|
| `DEEPSEEK_API_KEY` | platform.deepseek.com |
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `TELEGRAM_CHAT_ID` | @userinfobot |

## Alternativas de storage (cuando el cache no sea suficiente)

### 🟢 Nivel 1: Cloudflare R2 (gratis 10GB)

Respaldar lifeos.db a R2 después de cada run:

```bash
# Instalar wrangler
npm install -g wrangler

# Subir DB
cp runtime/lifeos.db backups/lifeos-$(date +%Y%m%d).db
rclone copy runtime/lifeos.db r2:lifeos-data/
```

### 🔥 Nivel 2: Neon Postgres (gratis 500MB)

Migrar stores a Postgres manteniendo la misma API:

```js
// Cambiar solo Database.js
const db = new pg.Client(process.env.DATABASE_URL);
// Misma API: db.prepare(sql).all()
```

### 🚀 Nivel 3: Turso (SQLite distribuido, gratis 9GB)

```bash
npm install @libsql/client
# Turso replica SQLite globalmente con latencia <10ms
```

## Migración desde local

```bash
# 1. Subir DB actual a cloud storage
rclone copy runtime/lifeos.db r2:lifeos-data/lifeos.db

# 2. Configurar secrets en GitHub
gh secret set DEEPSEEK_API_KEY < .env

# 3. Activar workflow
gh workflow run jarvis.yml
```

## Arquitectura final

```
GitHub Actions (cron */5 * * * *)
       │
  jarvis_loop --once
       │
  StateSnapshot → think() → decide() → emit()
       │
  Event Bus → Skills → Stores
       │
  actions/cache (persistencia entre runs)
       │
  (opcional) R2 / Neon / Turso (backup)
```

## Limitaciones conocidas

- GitHub Actions max 6h por run (irrelevante para `--once`)
- Cache no compartido entre ramas
- Retry automático si falla (built-in en Event Bus)
- Costo: $0 (free tier GitHub + secrets)
