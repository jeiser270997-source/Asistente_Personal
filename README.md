# 🧠 LifeOS - Segundo Cerebro de Jeiser
> Un sistema operativo personal que centraliza información, automatiza procesos rutinarios mediante reglas deterministas y utiliza Inteligencia Artificial unificada solo cuando el razonamiento semántico aporta un beneficio claro.

## 🏗️ Arquitectura
El sistema opera bajo un patrón de desacoplamiento limpio:
- **Event Bus v3** (con Transactional Outbox + DLQ) como sistema nervioso central.
- **Better-SQLite3** en modo WAL como almacenamiento relacional persistente de alta velocidad.
- **PM2** local como runtime para la orquestación continua de daemons y crons periódicos.
- **Dashboard** Next.js local conectado directamente a la base de datos SQLite en modo lectura.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18
- Python >= 3.10 (para subproyecto WheelSaver)
- PM2 (`npm install -g pm2`)
- `ntfy` y `uptime-kuma` (opcionales vía Docker Compose para monitoreo visual)

### Instalación
1. Copia `.env.example` a `.env` y completa las credenciales de las APIs.
2. Instala dependencias del root: `npm ci`
3. Instala dependencias del dashboard: `cd dashboard && npm ci`
4. Inicializa y migra la base de datos relacional: `npm run migrate`

### Ejecución (Modo PM2 Local)
Para arrancar toda la flota de procesos en PM2:
```bash
pm2 start ecosystem.config.js
```

Para monitorear el estado de los daemons en tiempo real:
```bash
pm2 status
pm2 monit
```

## Job Hunter (semi-auto)

Por defecto **no postula** en Computrabajo. PM2 corre `job-loop` y `computrabajo-apply` con `--dry-run` (scrape/score/CV o reporte de cola).

```bash
# Solo analizar / preparar (default)
node scripts/jobs/job_loop.js

# Postular de verdad (requiere supervisión humana)
node scripts/jobs/job_loop.js --auto
node scripts/jobs/computrabajo_apply.js --auto
```

Nunca añadir `--auto` a `ecosystem.config.js` sin aprobación explícita.

## Calidad / gate local

```bash
npm test                 # suite vitest
npm run runtime:ci       # guardrail de paths
```

## Modo agente (DeepSeek + herramientas)

LifeOS está pensado para que un agente con herramientas lo mantenga:

1. **Filtro:** si no está roto → no re-auditar; solo mantenimiento cuando haya síntoma.
2. **Contrato:** leer `AGENTS.md` + `ESTADO_VIVO.md` al inicio de sesión.
3. **Verificar:** tras un fix, `npm test`. Si falla un scraper, arreglar selectores; no reescribir el stack.
4. Detalle y límites: sección *Uso con agentes* en `AGENTS.md`.

Estado de la última auditoría aplicada: `docs/wheelsaver_audit_lifeos_2026-07-20.md` (Ronda 6 implementada).
