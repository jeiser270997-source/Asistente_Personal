/**
 * PM2 ecosystem — REFERENCIA (no usar en producción)
 *
 * ══════════════════════════════════════════════════════════
 *  LifeOS YA NO USA PM2 PARA CRON JOBS.
 * ══════════════════════════════════════════════════════════
 *
 * Flujo canónico actual (Jul 2026):
 *   npm run morning          # 5am wake → briefing → sleep (vía Task Scheduler)
 *   npm run session          # on-demand, 1–2 veces al día
 *   npm run session --fast   # solo briefing rápido
 *
 * Task Scheduler (Windows) — las únicas tareas activas:
 *   - LifeOS_MorningRoutine        → 5:00 AM  → morning_wake.js
 *   - LifeOS_PreDepartureRoutine    → 8:15 AM  → morning_wake.js
 *
 * PM2 solo se usa si quieres el health monitor HTTP (uptime-kuma):
 *   pm2 start ecosystem.config.js --only pm2-health
 *
 * Si PM2 molesta: pm2 kill && usa solo `npm run session`.
 */
module.exports = {
  apps: [
    // ── Health monitor HTTP (opcional, para uptime-kuma) ──────
    {
      name: "pm2-health",
      script: "./scripts/diagnostics/pm2_health_monitor.js",
      args: "--serve",
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 10_000,
      env: { NODE_ENV: "production" },
    },
  ],
};
