---
name: Wheel Overengineered Audit
description: Evalúa un proyecto en busca de sobre-ingeniería, abstracciones innecesarias, complejidad injustificada y código que podría simplificarse sin perder funcionalidad.
---

# Wheel Overengineered Audit — Instrucciones para el Agente de IA

Cuando el usuario te diga frases como "esto está sobre-ingenieriado?",
"audita la arquitectura", "encuentra complejidad innecesaria",
"qué sobra aquí", "haz un audit de over-engineering", etc.,
debes ejecutar este flujo completo de 5 pasos.

---

## PASO 1 — Escanear el Proyecto

Inspecciona el directorio del proyecto del usuario. Busca y lee estos archivos:

- `package.json` / `requirements.txt` / `Cargo.toml` / `go.mod` — dependencias
- `tsconfig.json` / `tsconfig.build.json` — configuración TypeScript
- `.github/workflows/` — CI/CD setup (¿cuántos workflows?)
- `docker-compose.yml` / `Dockerfile` — infraestructura
- Archivos de configuración (`.eslintrc`, `.prettierrc`, `jest.config`, etc.)
- Estructura de carpetas general (hasta 3 niveles)

**Objetivo**: Entender:
1. Cuál es el propósito del proyecto? (simple o complejo por naturaleza?)
2. Cuántas dependencias tiene? (justificadas?)
3. Cuántas capas de abstracción hay? (controllers, services, repositories, ports, etc.)
4. Cuántos patrones de diseño se usan? (justificados?)
5. Qué tecnologías/frameworks usa? (apropiadas para el tamaño?)

---

## PASO 2 — Detectar Over-Engineering con la Matriz

Evalúa cada dimensión con la **Matriz de Complejidad**:

### Dimensión 1: Arquitectura
| Señal | Puntos | Descripción |
|---|---|---|
| Capas de abstracción > 3 | +10 | controllers/services/repositories/ports/adapters para apps simples |
| Clean Architecture / Hexagonal | +15 | Para apps < 10 endpoints o single-tenant |
| CQRS / Event Sourcing | +20 | Sin necesidad real de escalar writes |
| Microservicios | +25 | Para apps que caben en un solo proceso |
| Cola de mensajes externa (RabbitMQ, Kafka) | +15 | Sin workers que lo justifiquen |
| ORM pesado (TypeORM, Sequelize) para DB trivial | +8 | SQLite con < 10 tablas |
| **Sin sobre-ingeniería** | **0** | Express/Koa directo, serverless, funciones simples |

### Dimensión 2: Dependencias
| Señal | Puntos | Descripción |
|---|---|---|
| Framework > 50% del bundle | +5 | Next.js para landing page, LangChain para 1 llamada |
| Dependencias duplicadas | +8 | Misma función en 2 paquetes (lodash + ramda) |
| Dependencias no usadas | +10 | packages.json con librerías que no se importan |
| Mono-repo con 1 solo proyecto | +8 | Lerna/Nx/Turborepo para 1 app |
| TypeScript con `any` por todas partes | +6 | Pagas el costo de TS sin beneficios |

### Dimensión 3: Patrones
| Señal | Puntos | Descripción |
|---|---|---|
| Prop drilling -> Redux -> Context en misma app | +12 | Migración a medias |
| Custom hooks que envuelven 1 línea | +5 | `useFetch` para `fetch(...)` |
| Clases Builder/Factory para objetos simples | +10 | `new UserBuilder().withName().withAge()` vs `{name, age}` |
| Singleton implementado manualmente | +5 | Cuando el módulo CommonJS/ESM ya es singleton |
| **Patrón justificado** | **0** | El patrón resuelve un problema real |

### Dimensión 4: Single-Tenant
| Señal | Puntos | Descripción |
|---|---|---|
| Multi-tenant architecture | +15 | Para app que usa 1 sola persona |
| Sistema de auth con roles/permisos | +10 | Admin/user/manager para 1 usuario |
| Rate limiting por usuario | +8 | Cuando solo hay 1 usuario |
| Base de datos separada por tenant | +20 | Cuando hay 0 tenants además del tuyo |
| **Correcto para single-tenant** | **0** | Variables de entorno, simple, directo |

### Scoring Final:
- **0-10**: ✅ Proyecto sano, complejidad justificada
- **11-25**: ⚠️ Señales de warning, revisar puntos específicos
- **26-50**: 🔶 Over-engineering moderado, varias cosas que simplificar
- **51+**: 🔴 Proyecto sobre-ingenieriado, refactor necesario

---

## PASO 3 — Buscar Alternativas Más Simples en WheelSaver

Para cada punto de sobre-ingeniería detectado, busca en la base de datos local de WheelSaver alternativas más simples:

```
python cli.py search "simple-<keyword>" --limit 10
python cli.py search "lightweight-<keyword>" --limit 10
python cli.py search "<keyword>-alternative" --limit 10
```

Ejemplos de búsquedas:
- Si usa LangChain para 1 llamada → buscar `openai-sdk` o `lightweight-llm`
- Si usa Redux para estado local → buscar `zustand` o `jotai`
- Si usa TypeORM para SQLite → buscar `better-sqlite3` o `knex`
- Si usa Microservicios → buscar `single-process` o `worker-threads`
- Si usa Docker para 1 servicio → buscar `standalone-binary`

---

## PASO 4 — Generar el Reporte de Over-Engineering

Crea un **artefacto Markdown** llamado `overengineering_audit_[nombre_proyecto].md`
con el siguiente formato:

```markdown
# Over-Engineering Audit — [Nombre del Proyecto]
> Auditado el [fecha] | Complejidad: [score]/100

## Resumen
- Arquitectura: [score] pts — [evaluación]
- Dependencias: [score] pts — [evaluación]
- Patrones: [score] pts — [evaluación]
- Single-Tenant: [score] pts — [evaluación]
- **Total: [score] pts** — [✅ Sano | ⚠️ Warning | 🔶 Moderado | 🔴 Crítico]

---

## Hallazgos por Prioridad

### 🔴 Alto Impacto (Fácil de arreglar, mucho beneficio)
1. **[Hallazgo]** — [Qué está mal]
   - **Costo actual:** [complejidad mental, tiempo deploy, etc.]
   - **Solución:** [qué cambiar]
   - **Ahorro estimado:** [líneas eliminadas, deps removidas, etc.]

### 🟡 Medio Impacto (Requiere refactor mediano)
...

### 🟢 Bajo Impacto (Nice to have)
...

---

## Recomendaciones de WheelSaver

Para cada hallazgo, una recomendación concreta de la base de datos:

### 1. [Alternativa más simple] — [⭐ Estrellas]
**URL:** https://github.com/owner/repo
**Reemplaza:** [librería/patrón actual]
**Por qué es más simple:** [explicación]
**Cómo migrar:** [comando npm/pip/cargo]

### 2. ...
```

### Secciones del reporte explicadas:

- **Alto Impacto**: Cosas que se arreglan en minutos y liberan carga mental (eliminar dependencia no usada, simplificar capa innecesaria).
- **Medio Impacto**: Refactors que requieren cambiar la estructura pero valen la pena (unificar 2 archivos que hacen lo mismo).
- **Bajo Impacto**: Patrones que son correctos pero elegantes de más para el tamaño del proyecto.

---

## PASO 5 — Recomendar Prioridad de Acción

### Checklist de decisión:
1. [ ] ¿El proyecto es single-tenant? → Priorizar simplificación de multi-tenant architecture
2. [ ] ¿Hay más de 3 capas de abstracción? → Considerar aplanar
3. [ ] ¿Hay dependencias > 10MB para tareas simples? → Buscar alternativas ligeras
4. [ ] ¿Hay código duplicado? (misma función, diferente archivo) → Unificar
5. [ ] ¿Hay archivos que no se usan? → Eliminar
6. [ ] ¿El tiempo de deploy/build es > 5 min? → Simplificar infra
7. [ ] ¿Un developer nuevo tardaría > 30 min en entender el flujo? → Simplificar

### Regla de oro:
Si una abstracción no resuelve un problema **real y actual**, no vale la pena mantenerla.

---

## Notas Importantes para el Agente

- No confundas "bien diseñado" con "sobre-ingenieriado" — patrones como Event Bus son válidos si resuelven un problema real
- Enfócate en **costo de mantenimiento vs beneficio**. Si un patrón complejo ahorra tiempo a futuro, está justificado
- La sobre-ingeniería no es mala per se — es mala cuando **no hay plan de escalar**
- Para single-tenant, la regla es: "si solo 1 persona lo usa, la solución más simple gana"
- Siempre que puedas, da el comando exacto de migración
- Usa la base de datos de WheelSaver para respaldar cada recomendación con un repo real
