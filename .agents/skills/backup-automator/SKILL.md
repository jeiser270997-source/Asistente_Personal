---
name: backup-automator
description: Gestor de backups automáticos para LifeOS, credenciales, documentos y skills. Activa cuando Jeiser habla de backups, copias de seguridad, respaldos, perder datos, o seguridad de archivos.
---

# Backup Automator — Protección de Datos LifeOS

## ¿Qué hay que respaldar?

### 🔴 CRÍTICO (perder esto = desastre)
| Recurso | Ruta | Frecuencia sugerida |
|---------|------|-------------------|
| Skills .agents/ | `.agents/skills/` (27 skills) | Diaria |
| Estado Vivo | `data/state/contexto_maestro/ESTADO_VIVO.md` | Diaria (cada cambio) |
| Memoria SQLite | `data/memoria_hipocampo.db` | Diaria |
| Master Ledger | `data/state/masterledger.json` | Diaria |
| Credenciales | `credentials.json`, `.google_token.json`, `token.json` | Semanal |
| .env (API keys) | `.env` | Cada cambio |

### 🟠 ALTO
| Recurso | Ruta | Frecuencia |
|---------|------|-----------|
| Configs scraping | `scripts/integrations/email_processor.js`, `scripts/jobs/` | Semanal |
| CVs y aplicaciones | `data/artifacts/jobs/`, `data/jobs/` | Semanal |
| WheelSaver DB | `E:/PROYECTOS/Mis_Proyectos/TOP_REPOS/data/top_repos.db` | Mensual |

### 🟡 MEDIO
| Recurso | Frecuencia |
|---------|-----------|
| Carpeta personal Documents/SKILLS/ | Mensual |
| Configuración del sistema (Windows Terminal, VS Code) | Mensual |
| Scripts de PowerShell | Mensual |

## Herramienta recomendada: Duplicati (14,320⭐)

Duplicati es open-source, self-hosted, encripta backups y los sube a la nube. Alternativas:
- **restic** — más moderno, CLI puro, soporta S3/BackBlaze
- **Kopia** (13,608⭐) — interfaz gráfica, multiplataforma
- **rclone** — scripteable, para sincronizar a Google Drive sin interfaz

## Plan de backup sugerido para LifeOS

```bash
# Backup diario de skills a Google Drive (vía rclone o node)
# Comando sugerido para GitHub (ya tienes git — es tu backup principal)
git add -A
git commit -m "chore: backup $(date +%Y-%m-%d)"
git push origin main

# Backup semanal a archivo zip
# windows: Compress-Archive -Path .agents, data -DestinationPath "backups/lifeos_$(Get-Date -Format yyyy-MM-dd).zip"
```

## Instrucciones

1. **Tu mejor backup ya es GitHub.** LifeOS está en git. Mientras haya commits y pushes, hay backup.
2. **Lo que NO está en git:** `token.json`, `.google_token.json`, `credentials.json`, `.env` (están en .gitignore por seguridad)
3. **Esos archivos hay que respaldarlos MANUALMENTE.**
4. **Sugerir a Jeiser:** Si no ha hecho push en 3+ días, recordarle que haga commit+push.
5. **Alertar si** detectas que `data/memoria_hipocampo.db` es mucho más pequeño de lo esperado (datos perdidos).

## Check-list mensual de respaldo

- [ ] ¿Git push hecho hoy?
- [ ] ¿Token de Google vigente? (`.google_token.json`)
- [ ] ¿Credenciales .env en un lugar seguro fuera del proyecto?
- [ ] ¿Skills nuevas respaldadas? (27 skills en `.agents/`)
- [ ] ¿Último backup de token.json existe?

## Reglas de seguridad

1. **NUNCA** incluir tokens, contraseñas o datos bancarios en commits de git.
2. **NUNCA** compartir el archivo `.env` ni `token.json`.
3. **Siempre** tener al menos 2 copias: una local (git) y una remota (GitHub).
4. **Si algo se pierde** y no hay backup, primero revisar git history antes de asumir pérdida total.
