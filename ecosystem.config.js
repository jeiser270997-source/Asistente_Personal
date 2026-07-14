module.exports = {
  apps: [
    { 
      name: "jarvis-telegram", 
      script: "./lib/telegram.js", 
      watch: false 
    },
    { 
      name: "jarvis-sensor", 
      script: "./scripts/integrations/inbox_sensor.js", 
      cron_restart: "*/15 * * * *", 
      autorestart: false 
    },
    { 
      name: "jarvis-brain", 
      script: "./scripts/schedulers/brain_orchestrator.js", 
      cron_restart: "0 7 * * *", 
      autorestart: false 
    }
  ]
};
