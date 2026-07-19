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
