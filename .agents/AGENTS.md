# Life OS - Segundo Cerebro de Jeiser

## Arquitectura (Julio 2026)

```
📱 Telegram ← → ☁️ GitHub Actions (24/7) ← → 🧠 DeepSeek V4 Flash (unico LLM)
                         ↓
                  📂 data/ (persistencia)
                  ├── sena/ (scraper + materiales + tracking)
                  ├── bootcamp/ (curriculum + progreso + repos)
                  ├── contexto_maestro/ (ESTADO_VIVO + ALERTAS)
                  ├── notas.md, metas.md, perfil.md
                  └── pending.json (tareas)
                         ↓
                  📚 E:\PROYECTOS\Proyectos_GitHub\ (73 repos)
```

## Skills del Ecosistema

| Tipo | Ubicacion | Cantidad |
|------|-----------|----------|
| **Skills OpenCode** | `.agents/skills/` | 16 (personalizadas) |
| **Skills Runtime** | `skills/` (JS + MD) | 12 (contexto dinamico) |
| **Skills Sistema** | `C:\Users\dev\.agents\skills\` | 1090+ (comunidad) |
| **Repos de Skills** | `Proyectos_GitHub/` | anthropics/skills, mattpocock/skills, awesome-claude-skills, awesome-agent-skills |

## Automatizaciones Cloud (GitHub Actions)

| Workflow | Frecuencia | Funcion |
|----------|-----------|---------|
| `sena_scraper.yml` | Lun-Vie 6am COL | Extrae actividades y fechas del Moodle SENA |
| `cloud-orchestrator.yml` | Lun-Vie 7am COL | Briefing matutino: correos + calendario + SENA |
| `telegram-listener.yml` | Cada 3 min | Bot bidireccional Telegram |
| `email-cleaner.yml` | Cada 3h | Limpieza y procesamiento de Gmail |
| `recordatorio_cesde.yml` | Lun/Mie/Vie 5pm COL | Recordatorio de clases CESDE |
| `reflexion_nocturna.yml` | 11pm COL | Auto-aprendizaje y actualizacion de perfil |

## Comandos Utiles

```bash
# SENA
node scripts/moodle_sena_scraper.js      # Extraer datos del Moodle
node scripts/moodle_sena_downloader.js   # Descargar PDFs/materiales
node scripts/moodle_sena_tracker.js ver  # Ver progreso de evidencias
node scripts/moodle_sena_tracker.js completar a2-01  # Marcar evidencia

# Bootcamp
node scripts/scan_local_repos.js         # Re-escanear repos locales

# Contexto
node scripts/agregar_contexto.js ver     # Ver contexto vital
node scripts/agregar_contexto.js nota "texto"  # Agregar nota

# GitHub
gh workflow run sena_scraper.yml         # Disparar scraper manualmente
```

## Reglas del Asistente

1. **Contexto Activo:** Antes de responder preguntas complejas, leer `data/contexto_maestro/ESTADO_VIVO.md`
2. **Rol Dinamico:** Psicologo si esta estresado, Tutor si pregunta de estudio, Organizador si esta disperso
3. **DeepSeek Unico:** Solo se usa DeepSeek V4 Flash. En horario pico (8pm-11pm, 1am-5am COL) no hay respuestas
4. **Cloud-First:** Todo corre en GitHub Actions. La PC solo se necesita para desarrollo y Ollama local
5. **Sinceridad Radical:** Prohibida la adulacion. Corregir directamente si esta equivocado. Cero alucinaciones
