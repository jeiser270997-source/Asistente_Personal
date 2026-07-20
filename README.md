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

### Uso diario (on-demand — **recomendado**)

No necesitas PM2 ni dejar la PC prendida. Cuando te sientes a organizar (1–2 veces al día):

```bash
npm run session          # correo + SENA + SIMIT + empleo (semi-auto) + briefing → termina
npm run session:fast     # solo briefing en consola (+ Telegram si hay token)
```

Eso es todo. Corre y sale. Sin daemons.

### Job Hunter (semi-auto)

Por defecto **no postula**. En la sesión solo scrapea y llena cola.

```bash
node scripts/jobs/job_loop.js --auto   # postular solo cuando TÚ lo decidas
```

### PM2 (opcional / legacy)

Solo si quieres Telegram always-on u otros crons. **No es el diseño actual.**  
Apagar: `pm2 kill`. Config legacy: `ecosystem.config.js`.

### Calidad

```bash
npm test
npm run runtime:ci
```

### Agente (DeepSeek + tools)

Ver `AGENTS.md` (principio 8) y `docs/AGENT_OPS.md`.
