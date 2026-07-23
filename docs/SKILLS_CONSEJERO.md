# Guía de Uso — Skills de Consejero Personal LifeOS v2.5

> **Fecha de creación**: 2026-07-23  
> **Módulo**: Consejero Personal & Marco de Decisiones  
> **Integración**: `.agents/skills/` + SQLite `memoria_hipocampo.db`

---

## 📋 Catálogo de las 8 Skills de Consejero

| Skill | Función y Rol | Archivos | Trigger Principal |
|-------|---------------|----------|-------------------|
| **`consejero_personal`** | **Orquestador Central**. Clasifica la consulta y deriva a la skill especializada. | `SKILL.md` | "necesito un consejo", "ayudame a decidir", "tengo una duda" |
| **`estoicismo`** | **Marco Emocional Estoico**. Citas de Séneca, Marco Aurelio y Epicteto. Separa lo controlable de lo incontrolable. | `SKILL.md`<br/>`sources.md` | "estoy estresado", "siento ansiedad", "tengo miedo", "frustracion" |
| **`arte_de_la_guerra`** | **Estrategia y Negociación**. Principios eticos de Sun Tzu aplicados a negociacion salarial y carrera. | `SKILL.md`<br/>`sources.md` | "como negocio", "competencia laboral", "estrategia de carrera" |
| **`reglas_de_murphy`** | **Gestión de Riesgo & Postmortem**. Analisis de fallos (5 Whys), plan B y resiliencia operativa. | `SKILL.md`<br/>`sources.md` | "algo salio mal", "postmortem", "evaluar riesgo", "que puede fallar" |
| **`libros_crecimiento`** | **Recomendador de Lectura Curada**. Recomienda libros completos, se niega a atajos o resúmenes pobres. | `SKILL.md`<br/>`sources.md` | "que libro me recomiendas", "quiero aprender de habitos" |
| **`anti_estafa`** | **Detector de Fraudes**. Fria evaluacion de riesgos ante propuestas de dinero, ponzi o crypto. | `SKILL.md`<br/>`sources.md` | "me ofrecieron un negocio", "esquema de inversion", "oferta rara" |
| **`constancia_disciplina`** | **Sistemas de Hábitos**. Enfocado en el Siguiente Paso Mínimo Viable (5 min). Cero discursos motivacionales vacios. | `SKILL.md`<br/>`sources.md` | "no tengo ganas", "perdi la rutina", "no quiero estudiar hoy" |
| **`family_first`** | **Filtro Familiar de Decisiones**. Evalúa el impacto en la familia confrontando `data/user/metas.md`. | `SKILL.md`<br/>`sources.md` | "debo aceptar esta oferta", "cambio grande", "impacto en mi tiempo" |

---

## ⚙️ Reglas Inquebrantables de Comportamiento

1. **Sinceridad Radical (Anti-Sycophancy)**: Cero adulación. Si una propuesta o idea de Jeiser es riesgosa o mala, la skill lo dice directamente sin rodeos.
2. **Citas Verificables**: Ninguna skill inventa citas ni libros. Toda referencia proviene estrictamente de `sources.md` o de `data/user/metas.md`.
3. **No Reemplaza la Terapia ni la Mentoría Humana**: Las skills son un marco de referencia rápido en sesión de IA, pero la comunicación con la esposa, la EPS y los mentores reales siempre tiene prioridad.

---

## 🚀 Cómo Invocar en Sesión
Al abrir sesión con el agente (Antigravity / OpenCode + DeepSeek V4 Flash), puedes consultar directamente:
- *"Jeiser: Necesito un consejo sobre si aceptar un trabajo nocturno extra."* → Se activa `consejero_personal` → deriva a `family_first`.
- *"Estoy frustrado porque no entiendo un tema de Playwright."* → Se activa `estoicismo` + `constancia_disciplina`.
- *"Me escribieron por Telegram ofreciéndome rentabilidad fija en crypto."* → Se activa `anti_estafa` (Veredicto: RIESGO ALTO).
