---
name: content-pipeline
description: Analista y optimizador del pipeline de YouTube automation (faceless-storyteller-bot). Activa cuando Jeiser habla de YouTube, canal, videos, scripts, contenido, o el bot storyteller.
---

# Content Pipeline — YouTube Automation Analytics

## Canal actual

| Métrica | Valor |
|---------|-------|
| **Nombre** | "Do NOT Enter" |
| **Nicho** | Horror / Liminal Spaces |
| **Videos publicados** | 25 |
| **Subscribers** | 1 |
| **Total views** | 405 |
| **Costo por video** | ~$0.20 USD (DeepSeek API) + electricidad |
| **Pipeline** | 100% autónomo |
| **Hardware** | GTX 1660 SUPER (6GB VRAM) |
| **Tech stack** | Node.js + Python + FFmpeg NVENC + Remotion + Stable Diffusion |
| **Script source** | Reddit scraping → DeepSeek V4 Pro → SQLite |

## Pipeline actual (faceless-storyteller-bot)

```
GitHub Actions (4AM) → Reddit scraper → DeepSeek script gen
→ Kokoro TTS → faster-whisper → SD images → FFmpeg render
→ YouTube upload → Telegram preview
```

## Métricas de salud del canal

Monitorear estas señales de alerta:
- **Retention < 40%:** El hook inicial es débil. Revisar `assets/skills/horror.md`
- **CTR < 3%:** Thumbnail no atractivo. Probar SD image + texto de alto contraste
- **0 views en 24h:** Shadowban o problema de metadata. Revisar tags, título, descripción
- **Script queue vacío:** GitHub Actions no corrió o Reddit scraper falló

## Instrucciones para el agente

1. **Si Jeiser pregunta por el canal**: dar métricas actuales primero, luego sugerencias.
2. **Si menciona un problema técnico** (SD images negras, FFmpeg error, OOM): usar la tabla de troubleshooting del README de faceless-storyteller-bot.
3. **Sugerir mejoras de contenido** basadas en:
   - retention promedio actual
   - nicho (horror/liminal — mantener consistencia)
   - competencia (yt-dlp scraping los domingos)
4. **Evaluar alternativas gratuitas** para reducir el costo de $0.20/video:
   - Open-Generative-AI (22,707 ⭐ en GitHub) — alternativa open-source a APIs de video
   - Modelos locales vs DeepSeek API paga
5. **Recordar el roadmap de monetización:**
   - Fase 1 (Ahora): Build social proof → 2+ canales
   - Fase 2 (Semana 4+): Vender servicios Upwork/Fiverr ($300-500/setup)
   - Fase 3 (Semana 8+): Productizar en Gumroad ($49-99)
   - Fase 4 (Opcional): SaaS video generation API ($19-49/mo)

## Troubleshooting rápido

| Síntoma | Causa | Solución |
|---------|-------|----------|
| SD images negras | GTX 16xx float16 bug | Bloquear a float32 en config |
| Script queue vacío | Actions no corrió | Revisar GitHub Actions status |
| Upload hung | YouTube API timeout | Timeout automático 10 min, reiniciar |
| Retention < 40% | Hook débil | Revisar horror.md skills, mejorar headline |
| OOM en SD | VRAM exhausto | Reducir steps ≤15, resolución ≤512×896 |

## Comandos útiles

- `npm run wheelsaver:audit` — auditar dependencias del pipeline
- `npm run wheelsaver:stats` — estadísticas de la BD de WheelSaver
- `node core/orchestrator.js --quick-test` — prueba rápida (2 escenas, sin voz)
- `node channel_doctor.js` — analítica semanal del canal
