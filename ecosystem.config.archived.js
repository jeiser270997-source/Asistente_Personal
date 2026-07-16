module.exports = {
  apps: [
    // ── Daemon (always-on) ──────────────────────────────────────
    {
      name: "jarvis-telegram",
      script: "./scripts/integrations/telegram_listener.js",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production" },
    },

    // ── Cron jobs (restart on schedule, exit after run) ────────

    // Brain orchestrator — diario 7am Colombia (12pm UTC)
    {
      name: "brain-orchestrator",
      script: "./scripts/schedulers/brain_orchestrator.js",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // Context engine — diario 6am Colombia (11am UTC)
    {
      name: "context-engine-daily",
      script: "./scripts/schedulers/context_engine_daily.js",
      cron_restart: "0 11 * * *",
      autorestart: false,
    },

    // Morning briefing — diario 7am Colombia (12pm UTC)
    {
      name: "morning-briefing",
      script: "./scripts/schedulers/morning_briefing.ts",
      exec_interpreter: "tsx",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // Email cleaner — cada 3h
    {
      name: "email-cleaner",
      script: "./scripts/integrations/email_processor.js",
      cron_restart: "0 */3 * * *",
      autorestart: false,
    },

    // Inbox sensor — cada 15 min
    {
      name: "inbox-sensor",
      script: "./scripts/integrations/inbox_sensor.js",
      cron_restart: "*/15 * * * *",
      autorestart: false,
    },

    // SENA scraper — lun-vie 6am Colombia (11am UTC)
    {
      name: "sena-scraper",
      script: "./scripts/integrations/moodle_sena_scraper.js",
      cron_restart: "0 11 * * 1-5",
      autorestart: false,
    },

    // SENA tracker — diario 7am Colombia (12pm UTC)
    {
      name: "sena-tracker",
      script: "./scripts/integrations/moodle_sena_tracker.js",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // SIMIT checker — diario 7am Colombia (12pm UTC)
    {
      name: "simit-checker",
      script: "./scripts/integrations/simit_scraper.js",
      cron_restart: "0 12 * * *",
      autorestart: false,
    },

    // DIAN scraper — lunes 9am Colombia (2pm UTC)
    {
      name: "dian-scraper",
      script: "./scripts/integrations/dian_scraper.js",
      cron_restart: "0 14 * * 1",
      autorestart: false,
    },

    // Computrabajo scraper — lun-vie 8am Colombia (1pm UTC)
    {
      name: "computrabajo-scraper",
      script: "./scripts/jobs/computrabajo_scraper.js",
      cron_restart: "0 13 * * 1-5",
      autorestart: false,
    },

    // Computrabajo auto-apply — lun-vie 9am Colombia (2pm UTC)
    {
      name: "computrabajo-apply",
      script: "./scripts/jobs/computrabajo_apply.js",
      cron_restart: "0 14 * * 1-5",
      autorestart: false,
    },

    // Job loop — lun-vie 10am Colombia (3pm UTC)
    {
      name: "job-loop",
      script: "./scripts/jobs/job_loop.js",
      cron_restart: "0 15 * * 1-5",
      autorestart: false,
    },

    // Healthcheck — diario 8am Colombia (1pm UTC)
    {
      name: "healthcheck",
      script: "./scripts/diagnostics/healthcheck.js",
      cron_restart: "0 13 * * *",
      autorestart: false,
    },

    // Recordatorio DeepSeek — 6am/7pm/10pm Colombia
    // 6am Colombia = 11am UTC
    // 7pm Colombia = 0am UTC (next day)
    // 10pm Colombia = 3am UTC (next day)
    {
      name: "recordatorio-deepseek",
      script: "./scripts/integrations/recordatorio_deepseek.js",
      cron_restart: "0 11,0,3 * * *",
      autorestart: false,
    },

    // Document pipeline — diario 9am Colombia (2pm UTC)
    {
      name: "document-pipeline",
      script: "./scripts/maintenance/document_pipeline.js",
      cron_restart: "0 14 * * *",
      autorestart: false,
    },

    // Vehicle manager — diario 6am Colombia (11am UTC)
    {
      name: "vehicle-manager",
      script: "./scripts/schedulers/vehicle_manager.js",
      cron_restart: "0 11 * * *",
      autorestart: false,
    },

    // Backups DB — diario 11pm Colombia (4am UTC)
    {
      name: "backup-dbs",
      script: "./scripts/maintenance/backup_dbs.ts",
      exec_interpreter: "tsx",
      cron_restart: "0 4 * * *",
      autorestart: false,
    },
  ],
};
