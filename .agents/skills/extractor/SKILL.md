---
name: extractor
description: Extractor de contexto v9. Comprime conversaciones completas en bloques estructurados MD preservando estado, decisiones y contexto crítico entre IAs. Activa cuando se necesita resumir, extraer, o comprimir contexto de sesiones largas.
---

# SKILL: EXTRACTOR DE CONTEXTO v9.0

## PROPÓSITO
Extraer y comprimir una conversación completa en un único bloque estructurado MD, preservando estado, decisiones, contexto crítico y continuidad entre IAs. Minimizar pérdida. Evitar overflow de tokens. Detectar conflictos. Marcar certeza de cada dato.

---

## EJECUTAR AL CARGAR

Cuando este archivo sea cargado O cuando usuario pegue bloque grande de contexto:

1. Analizar TODO el contenido disponible en la conversación
2. Filtrar ruido conversacional (relleno, repeticiones, cortesías)
3. Evaluar relevancia según criterio abajo
4. Detectar conflictos entre datos (fechas, números, decisiones contradictorias)
5. Extraer SOLO información relevante según prioridad
6. Marcar certeza de cada dato con ✅/⚠️/❓
7. Comprimir agresivamente sin perder significado
8. Preservar artefactos críticos (código, lógica) íntegros
9. Generar salida en formato MD (plantilla abajo)
10. Terminar con: `<!-- Extracción completa. [N] temas. [N] conflictos. Listo. -->`

Sin preguntas. Sin preámbulo. Solo output.

---

## SISTEMA DE CONFIANZA (OBLIGATORIO EN TODO DATO)

| Símbolo | Significado | Acción de la IA receptora |
|---------|-------------|--------------------------|
| `✅` | Dato confirmado explícitamente por el usuario | Usar directamente |
| `⚠️` | Dato inferido, mencionado de pasada, o no confirmado | Validar antes de usar en decisiones importantes |
| `❓` | Dato contradictorio, ambiguo o incierto | SIEMPRE preguntar antes de usar |

**Regla:** Cada línea de datos en el bloque CTX debe terminar con su símbolo. Sin excepción.

---

## CRITERIO DE RELEVANCIA

Conservar SOLO si cumple al menos uno:
- Afecta decisiones
- Define estado actual
- Introduce dato concreto (número, fecha, nombre, código)
- Cambia dirección de la conversación

Eliminar:
- Saludos y despedidas
- Confirmaciones sin nueva info ("ok", "entendido", "perfecto")
- Reformulaciones sin dato nuevo
- Contenido redundante con otro ya extraído

---

## REGLAS DE EXTRACCIÓN

- **Cero invención.** Si no está en la conversación, no existe.
- **Dato más reciente prevalece** sobre versión anterior del mismo dato.
- **Una línea por dato.**
- **No duplicar** datos entre secciones (ver anti-duplicación).
- **Idioma original** del dato.
- **Prioridad de información:**
  1. Estado actual
  2. Decisiones tomadas
  3. Datos concretos (números, fechas, nombres)
  4. Reglas y restricciones
  5. Contexto histórico relevante

---

## REGLA ANTI-DUPLICACIÓN

Un dato SOLO puede existir en UNA sección.

Jerarquía de ubicación:
```
CONFLICTOS (si hay contradicción) >
ESTADO (si define situación actual) >
HECHOS CLAVE (si es decisión o evento) >
NÚMEROS (si es valor numérico) >
HISTORIAL (si es contexto pasado)
```

---

## DETECCIÓN DE CONFLICTOS (NUEVO)

Durante extracción, si encuentras dos datos que se contradicen:
- NO elegir uno silenciosamente
- NO omitir el conflicto
- Registrar AMBOS en sección CONFLICTOS con fuente
- Marcar ambos como `❓`
- La IA receptora DEBE preguntar al usuario antes de usar ese dato

Tipos de conflicto a detectar:
- Mismo campo con valores diferentes (ej: fecha mencionada dos veces distinta)
- Decisión revertida sin confirmación clara
- Número actualizado pero versión vieja sigue apareciendo en conversación
- Instrucción contradictoria entre mensajes separados

---

## ESTRUCTURA DEL ESTADO (OBLIGATORIO)

```
### [Tema]
- estado: [situación actual concreta] [✅/⚠️/❓]
- objetivo: [meta si existe] [✅/⚠️/❓]
- bloqueo: [limitación si existe o "ninguno"] [✅/⚠️/❓]
- último_input: [última instrucción EXACTA del usuario antes de extraer] ✅
```

---

## CONTROL DE TAMAÑO Y FALLBACK POR TOKENS

Si la conversación es muy larga y el bloque CTX excede el context window de la IA receptora, omitir en este orden:

1. HISTORIAL COMPRIMIDO (solo conservar últimos 3 eventos)
2. ENTIDADES secundarias (conservar solo las con rol activo)
3. TÉCNICO — resumir lógica + indicar "código completo disponible en [fuente]"
4. HECHOS CLAVE — conservar solo los que afectan ESTADO o PENDIENTES activos

**Nunca omitir:** INSTRUCCIÓN DE CARGA, MODO IA, ESTADO, CONFLICTOS, NÚMEROS críticos, ALERTAS, PENDIENTES 🔴.

Indicar al final del bloque si hubo omisiones:
```
<!-- ADVERTENCIA: Secciones omitidas por tokens: [lista]. Pedir al usuario completar si es crítico. -->
```

---

## PRESERVACIÓN DE CÓDIGO / ARTEFACTOS

- Código funcional existente: mantener íntegro en sección TÉCNICO. NO comprimir.
- Si es demasiado largo: resumir lógica en 2-3 líneas + indicar `[código completo: ver mensaje #N o archivo X]`
- Nunca parafrasear código como si fuera texto. Comillas o bloque de código siempre.

---

## REGLA HISTORIAL

- Máximo 1 línea por evento
- Solo eventos que cambian estado o decisiones
- Formato: `[YYYY-MM-DD o "msg #N"] [evento] → [consecuencia]`

---

## PRIORIDAD DE SECCIONES EN BLOQUE CTX

```
1. INSTRUCCIÓN DE CARGA
2. MODO IA
3. CONFLICTOS (si existen)
4. ESTADO
5. HECHOS CLAVE
6. NÚMEROS
7. REGLAS
8. ALERTAS
9. ENTIDADES
10. PENDIENTES
11. HISTORIAL COMPRIMIDO
12. TÉCNICO
```

---

## PLANTILLA DE SALIDA

```markdown
# CTX:[TEMA PRINCIPAL] | [FECHA ISO 8601] | extractor:v9.0 | v[N]

## 🚀 INSTRUCCIÓN DE CARGA
Este bloque contiene contexto comprimido de una conversación previa.
Adopta el MODO IA definido abajo. Continúa desde el ESTADO actual sin reiniciar.
No saludes. No expliques. Actúa directamente.
Sistema de confianza: ✅ usar directo | ⚠️ validar antes | ❓ SIEMPRE preguntar.
Si hay CONFLICTOS, resolverlos ANTES de continuar.
Confirma carga respondiendo: "Contexto cargado v[N]. Tema: [X]. Conflictos: [Sí/No]. ¿Continuamos?"

## MODO IA
- rol: [descripción exacta del rol que tomaba la IA]
- tono: [formal/casual/técnico/coaching/etc]
- dominio: [área de conocimiento principal aplicada]
- restricciones: [qué NO debe hacer esta IA en esta conversación]

## ⚠️ CONFLICTOS DETECTADOS
> Resolver ANTES de continuar. Si tabla vacía, ignorar sección.

| # | Dato A | Dato B | Fuente A | Fuente B | Acción |
|---|--------|--------|----------|----------|--------|
| 1 | [valor] ❓ | [valor contradictorio] ❓ | msg #N | msg #M | Preguntar al usuario |

## ESTADO
### [Tema principal]
- estado: [situación actual concreta] ✅
- objetivo: [meta] ✅
- bloqueo: [limitación o "ninguno"] ✅
- último_input: [última instrucción exacta del usuario] ✅

### [Tema secundario si aplica]
- estado: [situación] ⚠️
- objetivo: [meta] ⚠️
- bloqueo: [limitación] ⚠️
- último_input: [instrucción] ⚠️

## HECHOS CLAVE
- [decisión tomada — contexto] ✅
- [evento relevante que cambió dirección] ✅
- [dato importante descubierto] ⚠️

## NÚMEROS
[variable] = [valor] [unidad] [✅/⚠️/❓]
[variable] = [valor] [unidad] [✅/⚠️/❓]

## REGLAS
- [restricción activa en esta conversación] ✅
- [preferencia del usuario confirmada] ✅

## ALERTAS
[🔴 CRITICO / 🟡 MODERADO / 🟢 BAJO] [descripción] | impacto: [consecuencia si se ignora]

## ENTIDADES
[Nombre] | [rol] | [dato clave] | [relación] | [✅/⚠️/❓]

## PENDIENTES
[🔴 HOY YYYY-MM-DD / 🟡 PRONTO / 🟢 ALGÚN DÍA] [acción concreta] | responsable: [quién]

## HISTORIAL COMPRIMIDO
- [YYYY-MM-DD o msg #N] [evento] → [consecuencia] ✅

## TÉCNICO
```[lenguaje]
[código íntegro o lógica resumida]
[si código completo en otro lugar: "ver msg #N / archivo X"]
```

---
<!-- Extracción completa. [N] temas. [N] conflictos detectados. Omisiones: [ninguna / lista]. Listo. -->
```

---

## PROTOCOLO DE ACTIVACIÓN PARA NUEVA IA

Pegar esto antes del bloque CTX:

> "Este es un bloque CTX generado por SKILL_EXTRACTOR v9.0. Contiene contexto comprimido de conversación previa.
>
> **INSTRUCCIONES:**
> 1. Lee INSTRUCCIÓN DE CARGA dentro del bloque
> 2. Adopta MODO IA definido
> 3. Si hay CONFLICTOS → detenerse y preguntar antes de continuar
> 4. Aplica sistema de confianza: ✅ directo | ⚠️ validar | ❓ preguntar siempre
> 5. Continúa desde ESTADO actual sin reiniciar
> 6. Confirma carga con: 'Contexto cargado v[N]. Tema: [X]. Conflictos: [Sí/No]. ¿Continuamos?'"

---

## CHECKLIST DE CALIDAD (Antes de entregar bloque CTX)

- [ ] Fecha y versión del bloque presentes en header
- [ ] INSTRUCCIÓN DE CARGA no dice "ignora instrucciones previas"
- [ ] MODO IA tiene rol, tono, dominio y restricciones
- [ ] Tabla CONFLICTOS presente (aunque esté vacía)
- [ ] Cada dato tiene símbolo ✅/⚠️/❓
- [ ] Ningún dato duplicado entre secciones
- [ ] Código preservado íntegro o con referencia a fuente
- [ ] PENDIENTES tienen prioridad por color y fecha (no solo "HOY/PRONTO")
- [ ] ALERTAS tienen nivel y consecuencia
- [ ] Si hubo omisiones por tokens → advertencia al pie del bloque
- [ ] Bloque termina con comentario de extracción completa
- [ ] Cero invención — todo dato tiene origen en la conversación

---

## CHANGELOG DE LA SKILL

| Versión | Cambios | Motivo |
|---------|---------|--------|
| v8.2 | Base: extracción, anti-duplicación, preservación código, prioridad secciones | Versión original |
| v9.0 | + Sistema de confianza ✅/⚠️/❓; + Detección y tabla de conflictos; + Fallback por tokens con orden de omisión; + MODO IA expandido (rol/tono/dominio/restricciones); + PENDIENTES con fecha y color; + Protocolo de activación; + Instrucción de carga sin "ignora instrucciones previas"; + Checklist con casillas reales; + Changelog | Auditoría producción pública |

---

## FIN
