---
name: skill-auditor
description: Auditor de seguridad para skills del agente. Inspirado en NVIDIA SkillSpector. Activa cuando Jeiser pide auditar skills, revisar seguridad, o verificar datos expuestos en los agentes.
---

# Skill Auditor — Security Scanner for AI Agent Skills

## Inspiración
Basado en `NVIDIA/SkillSpector` (9,325 ⭐ en GitHub) — security scanner for AI agent skills.

## Superficie de ataque actual

LifeOS tiene **24 skills** que pueden leer/escribir archivos, ejecutar comandos, y acceder a APIs externas:

### Skills activas (.agents/skills/ + skills/)
| # | Skill | Acceso a | Riesgo |
|---|-------|----------|--------|
| 1 | `anti-sycophancy` | Solo texto | Bajo |
| 2 | `archify` | Lectura de código | Bajo |
| 3 | `buen_gusto` | Solo texto | Bajo |
| 4 | `caveman` | Solo texto | Bajo |
| 5 | `cerebro` | ESTADO_VIVO.md (lectura/escritura) | Medio |
| 6 | `ciberseguridad` | Solo texto | Bajo |
| 7 | `content-pipeline` | YouTube API, métricas | Medio |
| 8 | `extractor` | Lectura de documentos | Medio |
| 9 | `financiero` | (ELIMINADO — mergeado en finanzas_didi) | — |
| 10 | `finanzas_didi` | Datos financieros, deudas, DIAN | **Alto** |
| 11 | `ingeniero` | Código, terminal | **Alto** |
| 12 | `ingeniero_avanzado` | Código, terminal | **Alto** |
| 13 | `job_hunter` | CV, aplicaciones, datos personales | **Alto** |
| 14 | `karpathy_guidelines` | Solo texto | Bajo |
| 15 | `last30days` | Web search, X, Reddit | Medio |
| 16 | `modo_diario` | Escucha sin filtros (datos sensibles) | **Alto** |
| 17 | `personal-dashboard` | Lectura de todos los datos | Medio |
| 18 | `product_manager` | Solo texto | Bajo |
| 19 | `psicologo` | Datos emocionales | Medio |
| 20 | `qa_bootcamp` | Solo texto | Bajo |
| 21 | `second-brain-health` | Datos de salud | **Alto** |
| 22 | `skill-auditor` | Lectura de todas las skills | Medio |
| 23 | `softball` | Datos de calendario | Bajo |
| 24 | `transito` | SIMIT, multas, datos legales | Medio |
| 25 | `tributaria` | DIAN, deudas, RUT | **Alto** |
| 26 | `tutor` | Solo texto | Bajo |
| 27 | `vehicle-manager` | Placas, SOAT, docs vehículos | Medio |

## Datos sensibles que NUNCA deben exponerse

Estos datos están en el sistema y las skills NO deben revelarlos en prompts públicos o logs:

| Dato | Ubicación | Nivel |
|------|-----------|-------|
| CC / Documento Identidad | ESTADO_VIVO.md, DIAN | 🔴 Crítico |
| Placa Vehicular Principal | ESTADO_VIVO.md, transito | 🟠 Alto |
| Placa Vehicular Secundario | ESTADO_VIVO.md | 🟠 Alto |
| Dirección Residencial | ESTADO_VIVO.md | 🟠 Alto |
| Teléfono Personal | ESTADO_VIVO.md | 🟠 Alto |
| Email Principal | Múltiples archivos | 🟡 Medio |
| Obligaciones Tributarias | ESTADO_VIVO.md, finanzas_didi | 🟡 Medio |
| Contraseñas (SENA, DIAN, Computrabajo) | ESTADO_VIVO.md | 🔴 Crítico |

## Instrucciones para el agente

1. **Auditar una skill específica:** Cuando Jeiser diga "audita la skill X", leer el SKILL.md correspondiente y verificar:
   - ¿Incluye datos sensibles en el prompt? (CC, placa, dirección, teléfono, contraseñas)
   - ¿Hace llamadas a APIs externas sin sanitización?
   - ¿Ejecuta comandos de terminal sin validación?
   - ¿Tiene instrucciones que podrían ser explotadas por inyección de prompt?

2. **Auditar todas las skills:** `/audit-all` — genera un reporte con nivel de riesgo de cada skill.

3. **Reglas de seguridad para nuevas skills:**
   - Nunca hardcodear datos sensibles en SKILL.md
   - Usar referencias a archivos externos (ESTADO_VIVO.md, .env) en vez de valores literales
   - Validar inputs antes de pasarlos a APIs externas
   - Las skills que ejecutan comandos deben requerir confirmación explícita

4. **Reporte mensual:** Sugerir a Jeiser correr una auditoría completa cada mes.
