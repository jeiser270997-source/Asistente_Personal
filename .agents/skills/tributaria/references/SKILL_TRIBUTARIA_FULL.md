---
name: tributaria-colombia-defensa
version: 5.4
description: >
  Skill de defensa tributaria para personas naturales en Colombia ante la DIAN.
  Úsala SIEMPRE que el usuario suba documentos DIAN (requerimiento especial,
  liquidación oficial, mandamiento de pago, exógena, extractos bancarios,
  declaraciones de renta) o pida analizar un caso tributario, armar una guía
  de procedimiento, plantear una estrategia de defensa, revisar plazos y
  acciones, o redactar memoriales y descargos. Aplica la tesis nuclear del
  Art. 26 ET, el módulo probatorio, la arquitectura de defensa por niveles,
  el árbol de decisión y la plantilla de output obligatoria definidos en esta skill.
  Perfil: contador + auditor DIAN + litigante experto + penalista tributario.
---

<!-- SKILL FINAL — DEFENSA TRIBUTARIA COLOMBIA PN v6.0 (actualizado Jul 2026) -->
<!-- UVT 2026: $52,374 | SMMLV 2026: $1,623,500 -->
<!-- Ver SKILL.md v6.0 para topes y sanciones 2026 -->

═══════════════════════════════════════════════════════════════════
PROTOCOLO DE ACTIVACIÓN — INSTRUCCIONES DE USO
═══════════════════════════════════════════════════════════════════

CUANDO EL USUARIO SUBA DOCUMENTOS:

1. Identificar el tipo de documento:
   - Requerimiento Especial (RE) → activar módulo procedimiento administrativo + vicios del RE
   - Liquidación Oficial → activar niveles 3-4 + recurso reconsideración
   - Mandamiento de Pago / Cobro Coactivo → activar módulo cobro coactivo + evaluar 814
   - Exógena / Extractos → activar tesis nuclear Art. 26 + módulo probatorio
   - Declaración de renta → verificar topes UVT, coherencia patrimonial, cripto

2. Ejecutar SIEMPRE el Checklist Pre-Litigio (Prioridad 0 primero) antes de generar la guía.

3. Identificar los datos clave del caso:
   - Nombre y NIT del contribuyente
   - Año(s) gravable(s) involucrados
   - Montos reportados por exógena vs declarados
   - Estado actual: ¿hay cobro coactivo activo? ¿RE notificado? ¿Liquidación en firme?
   - ¿Hay criptoactivos involucrados?

4. Aplicar el árbol de decisión genérico para determinar la ruta.

5. Generar la guía usando la PLANTILLA OBLIGATORIA de output.

REGLA: Si los documentos no tienen información suficiente para completar algún campo
de la plantilla, indicarlo explícitamente como "DATO FALTANTE — solicitar al contribuyente"
en lugar de asumir o inventar.

═══════════════════════════════════════════════════════════════════
MODO BLITZ — RESPUESTA URGENTE (RE CON TÉRMINO ≤ 15 DÍAS HÁBILES)
═══════════════════════════════════════════════════════════════════

Activar cuando el usuario indique que el término de respuesta al RE está próximo a vencer.
En modo blitz omitir el análisis completo y ejecutar SOLO esto en orden:

PASO 1 — ACCIÓN INMEDIATA (día 1):

- Radicar solicitud de prórroga ante la DIAN (Art. 708 ET): hasta 3 meses adicionales.
  Argumento: complejidad del caso + volumen documental a revisar.
  Formato: derecho de petición simple. No requiere mayor sustentación.
- Esto detiene el reloj y da tiempo para la defensa completa.

PASO 2 — SI NO CONCEDEN PRÓRROGA (días 2-5):

- Respuesta mínima viable: presentar escrito con:
  a) Identificación del contribuyente y período gravable.
  b) Negación expresa de los cargos del RE (no aceptar ninguno).
  c) Tesis nuclear Art. 26 ET en 2 párrafos (usar frase nuclear de la skill).
  d) Reserva de pruebas: "se aportarán en el término adicional que se solicita".
  e) Solicitud de término probatorio (Art. 709 ET).
- Objetivo: interrumpir el silencio procesal, no ganar el caso en esta etapa.

PASO 3 — PRUEBA MÍNIMA URGENTE (días 2-5 en paralelo):

- Extractos bancarios completos del período (prioridad 1).
- Listado de las 10 transacciones más grandes con explicación de origen y destino.
- Estos solos ya desvirtúan parcialmente la base del RE.

PASO 4 — ALERTA PENAL RÁPIDA:

- Calcular si la diferencia RE supera 100 SMMLV.
- Si SÍ: escalar a abogado penalista ANTES de radicar cualquier escrito.
- Si NO: continuar con defensa administrativa.

REGLA BLITZ: Una respuesta imperfecta radicada en término vale infinitamente más
que una respuesta perfecta radicada un día después.

═══════════════════════════════════════════════════════════════════
TESIS NUCLEAR
═══════════════════════════════════════════════════════════════════
Artículo 26 ET
Ingreso = enriquecimiento real + incremento patrimonial neto + permanencia

Regla de oro:

- Flujo sin acumulación → NO ingreso per se, salvo prueba en contrario por indicios de renta
- Saldo final neutro → NO renta
- Sin incremento patrimonial → NO hecho generador
- Sin permanencia del recurso → NO enriquecimiento

ADVERTENCIA DE HABITUALIDAD v2.0:
La rotación pura NO genera ingreso, PERO si media actividad económica habitual,
el flujo SÍ puede contener renta gravable. El test de habitualidad DIAN evalúa:

1. RECURRENCIA CUANTITATIVA:
   - Recurrencia mensual >50% del flujo total, O
   - Volumen >> ingresos declarados (>10x).

2. ORGANIZACIÓN EMPRESARIAL MÍNIMA:
   - ¿Existen contratos, facturas, registros de inventario, cuentas por cobrar/pagar?
   - ¿Hay estructura de costos (proveedores, transporte, almacenamiento)?
   - ¿Se usa nombre comercial, redes sociales de venta, catálogos?
   - Si la DIAN prueba 2+ de estos elementos → riesgo de habitualidad ALTO.

3. EXPECTATIVA DE UTILIDAD:
   - ¿El contribuyente obtiene margen, comisión, diferencial o beneficio económico?
   - Ejemplo: comerciante con rotación de inventario → el margen es ingreso.
   - Ejemplo: recaudo con comisión retenida → la comisión SÍ es ingreso.
   - Ejemplo: P2P con spread → el spread es ingreso.
   - La defensa por flujo neutro solo opera cuando NO hay margen de ganancia ni utilidad esperada.

REGLA OPERATIVA: Si se cumplen (1) + al menos uno de (2) o (3) → evaluar riesgo de
"actividad económica de facto". La defensa por Art. 26 ET debe combinarse con prueba
de ausencia de utilidad real.

PRINCIPIO CLAVE: La habitualidad por sí sola NO convierte el flujo en renta gravable.
La DIAN debe acreditar, además de recurrencia, que media incremento patrimonial neto
o enriquecimiento real (Art. 26 ET). "Realidad económica sobre forma" opera A FAVOR del
contribuyente cuando la realidad es: flujo transitorio sin apropiación.

ESTRATEGIA ANTI-HABITUALIDAD — CÓMO DESMANTELARLA:

Paso 1 — Probar ausencia de utilidad real:

- Presentar balance entrada/salida por período: si el resultado neto es cero o negativo,
  no hay enriquecimiento. La DIAN debe probar el margen, no asumirlo.
- Documentar que NO hubo retención de comisión, spread ni diferencial en ninguna operación.
- Si hubo pérdidas en algún período: documentarlas como contraindicio de ánimo de lucro.

Paso 2 — Destruir el elemento de organización empresarial:

- Probar que NO existen: contratos formales de compraventa, facturas emitidas, RUT con
  actividad comercial, registro mercantil, empleados, proveedores fijos.
- La informalidad del flujo es argumento A FAVOR: una empresa organizada deja rastro
  institucional. La ausencia de ese rastro prueba que no hay actividad económica de facto.
- Certificado de Cámara de Comercio de no inscripción si aplica.

- ARGUMENTO RUT (v5.1 — VITAL): Verificar el código CIIU registrado en el RUT del
  contribuyente ANTES de cualquier actuación.
  • Si el CIIU es de empleado (serie 0) o independiente (servicios personales) y NO
  de comercio o intermediación → argumento directo: "El propio contribuyente no se
  auto-reconoció como agente económico de actividad comercial. Si la DIAN alega
  habitualidad comercial, debe explicar por qué el RUT del contribuyente no refleja
  esa supuesta realidad económica, y por qué la DIAN tampoco lo detectó ni lo
  inscribió de oficio en el régimen correspondiente."
  • Si el CIIU SÍ tiene actividad comercial registrada → riesgo ALTO. La DIAN usará
  el propio RUT como prueba de habitualidad. En ese caso actualizar el RUT PRIMERO
  si el código no corresponde a la actividad real, antes de cualquier actuación.
  • Prueba documental: imprimir el RUT vigente con fecha y anexarlo al memorial.

Paso 3 — Atacar la recurrencia como elemento neutro:

- Argumento: la recurrencia del flujo prueba la naturaleza del rol (recaudo, intermediación,
  rotación de fondos propios), NO el ánimo de lucro.
- Ejemplo: una persona que recibe y envía dinero de su grupo familiar todos los meses
  tiene flujo recurrente sin que eso sea actividad económica.
- Presentar explicación narrativa coherente de por qué el flujo es recurrente sin ser renta.

Paso 4 — Frase de cierre en memoriales:
"La recurrencia de los movimientos bancarios refleja la naturaleza operativa de las
transferencias, no la existencia de una actividad económica organizada. En ausencia
de enriquecimiento patrimonial neto (Art. 26 ET) y de organización empresarial
verificable, la habitualidad es un criterio insuficiente para configurar el hecho
generador del impuesto sobre la renta."

ADVERTENCIA DE INDICIOS INDIRECTOS:

- La DIAN puede imputar ingreso por indicios indirectos de renta aunque el flujo bancario sea neutro.
- Ejemplos de indicios: estilo de vida desproporcionado, compras de activos en efectivo,
  inversiones no explicadas, patrimonio creciente sin ingresos declarados.
- El flujo neutro defiende la cuenta bancaria, pero NO blinda contra indicios externos.
- La defensa integral requiere coherencia patrimonial total (corte 31/dic + estilo de vida).

ESTÁNDAR PROBATORIO DIAN (CARGA DINÁMICA):

- La DIAN solo puede invertir la carga probatoria cuando presenta INDICIOS GRAVES,
  PRECISOS Y CONCORDANTES que converjan en una misma inferencia lógica.
- El mero volumen bancario NO es indicio suficiente: debe haber pluralidad simétrica
  de hechos indicadores debidamente acreditados.
- Sentencia CE: "debe existir concordancia entre los hechos indicadores y los hechos
  indicados, con convergencia que permita llegar a una misma inferencia lógica".
- Si la DIAN no alcanza este estándar: la carga permanece en ella, NO se desplaza al contribuyente.
- MATIZ PRÁCTICO: En la fiscalización real, la DIAN suele considerar que las inconsistencias
  exógenas por sí solas constituyen "indicios graves". Por eso la coherencia patrimonial
  y la validación cruzada (PASO 5) son defensas previas obligatorias, no opcionales.
  La teoría jurídica es clara; la práctica administrativa exige blindaje probatorio total.

═══════════════════════════════════════════════════════════════════
ARQUITECTURA DE DEFENSA
═══════════════════════════════════════════════════════════════════

Nivel 1 — Principal (Art. 26 ET)

- Tesis: no existe enriquecimiento patrimonial real
- Efecto: niega el hecho generador del impuesto
- Prueba: conciliación bancaria, matriz origen-aplicación, corte patrimonial
- Activar: SIEMPRE desde el primer momento (memorial + declaración).

Nivel 2 — Refuerzo (Operaciones de alta rotación / Recaudo / Dispersión)

- Tesis: los valores ingresan y salen sin apropiación ni permanencia
- Efecto: demuestra que el flujo no es ingreso gravable
- Prueba:
  a) Transferencias correlativas (entrada y salida con fechas próximas).
  b) Órdenes de pago y soportes de destino.
  c) Contratos de mandato, recaudo o intermediación → SOLO SI EXISTEN SOPORTES REALES VERIFICABLES.
  NUNCA sugerir ni aceptar contratos falsos o retroactivos.
  Si no hay contrato, la defensa se sustenta en la trazabilidad bancaria pura.
- Activar: junto con Nivel 1, desde la declaración.

Nivel 3 — Subsidiario (Art. 755-3 ET)

- Tesis: la presunción legal del 50% se desvirtúa con prueba en contrario
- Efecto: reduce o elimina la base gravable presunta
- Prueba: origen lícito, destino identificable, ausencia de enriquecimiento
- TIMING TÁCTICO: Activar cuando la DIAN YA cuantificó base presunta (RE o Liquidación).
  NO usar prematuramente en la declaración inicial — no existe casilla en Muisca para invocar
  el 755-3; es un argumento de contradicción administrativa (memorial de descargos o
  reconsideración), NO declarativo — es muro de contención, no puerta de entrada.
- ADVERTENCIA: NO usar como principal. Es un muro de contención, no una puerta.

Nivel 4 — Sanción (Art. 647 Parágrafo 2° ET)

- Tesis: existe diferencia de criterio o interpretación razonable del derecho
- Efecto: elimina la sanción por inexactitud del Art. 648 ET (20%)
- Requisito: buena fe + interpretación razonable + no datos falsos/alterados
- Activar: en respuesta al RE o en reconsideración, cuando la DIAN impugna la declaración.
- ADVERTENCIA CRÍTICA: el Parágrafo 2° NO es el Inciso 4. El Inciso 4 sanciona datos falsos/alterados. Jamás mezclar.

═══════════════════════════════════════════════════════════════════
MÓDULO PROBATORIO (OBLIGATORIO)
═══════════════════════════════════════════════════════════════════

1. Conciliación bancaria integral
   - Entradas vs salidas → diferencia ≈ 0 o explicada
   - Todos los productos bancarios del contribuyente
   - Sin exclusiones arbitrarias

2. Matriz origen–aplicación
   - Columna A: origen del recurso (quién, cuándo, por qué)
   - Columna B: aplicación del recurso (a quién, cuándo, para qué)
   - Columna C: diferencia (debe ser 0 o justificada)
   - Debe cerrar exacto al céntavo

3. Trazabilidad documental
   - Cada entrada → salida identificable con soporte
   - Fecha, monto, tercero, concepto, soporte
   - Cadena de custodia documental

4. Corte patrimonial 31 de diciembre
   - Activos reales vs pasivos reales
   - Saldo patrimonial bajo o coherente con capacidad económica declarada
   - Sin activos ocultos ni pasivos ficticios
   - Debe ser coherente con el estilo de vida del contribuyente (blindaje contra indicios indirectos)

5. Soporte bancario
   - Extractos completos (todas las páginas)
   - Sin edición ni tachaduras
   - Orden cronológico
   - Certificación bancaria cuando sea posible

═══════════════════════════════════════════════════════════════════
MÓDULO COHERENCIA PATRIMONIAL (v4.5 REFORZADO)
═══════════════════════════════════════════════════════════════════

OBJETIVO: Cerrar el flanco de ataque DIAN por "estilo de vida" e indicios indirectos.

PRINCIPIO: El flujo neutro defiende la cuenta, pero la coherencia patrimonial
blinda al contribuyente contra el argumento: "si no tiene ingresos, ¿cómo vive?"

PASO 1 — Inventario de gastos personales anuales
| Concepto | Valor mensual estimado | Valor anual | Soporte |
|----------|------------------------|-------------|---------|
| Arriendo / vivienda | $[X] | $[X×12] | Recibo, contrato |
| Alimentación | $[X] | $[X×12] | Estimación razonable |
| Salud (EPS) | $[X] | $[X×12] | Certificado ADRES |
| Transporte | $[X] | $[X×12] | Recibos, tarjeta |
| Educación (hijos) | $[X] | $[X×12] | Recibos colegio |
| Servicios públicos | $[X] | $[X×12] | Recibos EPM, etc. |
| Vestuario / higiene | $[X] | $[X×12] | Estimación razonable |
| TOTAL GASTOS ANUALES | | $[SUMA] | |

PASO 2 — Comparación ingresos vs gastos

- Ingresos declarados anuales: $[INGRESOS]
- Gastos personales anuales: $[GASTOS]
- Diferencia: $[INGRESOS - GASTOS]

REGLAS:

- Si INGRESOS ≥ GASTOS → coherente. El contribuyente se sostiene con sus ingresos.
- Si INGRESOS < GASTOS → explicar diferencia:
  a) Ayudas familiares (documentar con transferencias o declaración juramentada del tercero).
  b) Subsidios estatales (documentar con certificados).
  c) Sostenimiento por pareja/cónyuge (documentar con certificado de matrimonio o unión marital, y extractos de la pareja si aplica).
  d) Ahorros preexistentes (documentar con extractos de años anteriores).
  e) Deuda / préstamo (solo con contrato real verificable).

- NUNCA inventar ayudas, préstamos o ingresos sin soporte.
- NUNCA dejar la diferencia sin explicación — es el punto de ataque DIAN #1.

PASO 3 — Coherencia patrimonio acumulado

- Patrimonio 31/dic año anterior: $[PATRIMONIO N-1]
- Ahorro neto año actual (ingresos - gastos): $[AHORRO]
- Patrimonio esperado 31/dic año actual: $[PATRIMONIO N-1 + AHORRO]
- Patrimonio real declarado 31/dic: $[PATRIMONIO REAL]

REGLAS:

- Si PATRIMONIO REAL ≈ PATRIMONIO ESPERADO → coherente total.
- Si PATRIMONIO REAL > PATRIMONIO ESPERADO → explicar:
  a) Herencia o donación (documentar con escritura pública).
  b) Ganancia ocasional (documentar con soporte de enajenación).
  c) Revaluación de activos (documentar con avalúo).
- Si PATRIMONIO REAL < PATRIMONIO ESPERADO → explicar:
  a) Pérdida o robo (documentar con denuncia o seguro).
  b) Regalo o donación a terceros (documentar con soporte).
  c) Gasto no registrado (documentar si es posible).

PASO 4 — Documentación obligatoria

- Certificado ADRES EPS (prueba afiliación y régimen).
- Recibo servicios públicos (dirección real = dirección RUT).
- Certificado colegio/hogar infantil (si hay hijos menores).
- Extractos bancarios de AÑOS ANTERIORES (prueba ahorro preexistente).
- Declaración juramentada de tercero que aporta ayudas (solo si existe).

PASO 5 — Validación cruzada contra información exógena de terceros

- Cruzar gastos personales con lo reportado por terceros en exógena:
  • Colegios: ¿reportaron pagos que no coinciden con ingresos declarados?
  • EPS/ARL: ¿reportan cotizaciones inconsistentes con capacidad económica?
  • Entidades financieras: ¿reportan consumos o cupos de crédito desproporcionados?
- OBJETIVO: detectar inconsistencias ANTES que la DIAN, y explicarlas documentalmente.
- REGLA: si la DIAN encuentra una inconsistencia exógena que el contribuyente no explicó,
  usa eso como indicio para invertir la carga probatoria. Cerrar ese flanco primero.

═══════════════════════════════════════════════════════════════════
MÓDULO CONTRAATAQUE DIAN + VICIOS DEL RE
═══════════════════════════════════════════════════════════════════

Ataque 1 — Error en la base gravable (PRINCIPAL)

- La DIAN confunde flujo de caja con ingreso gravable
- Art. 26 ET: el ingreso requiere enriquecimiento, no mero movimiento
- Sentencia CE 20635 de 2017: los dineros que ingresan a título de recaudo,
  circulación o administración no constituyen ingreso gravable si no media
  apropiación ni enriquecimiento patrimonial del intermediario.
  → NOTA: Esta sentencia trata renta comparación patrimonial (Art. 236 ET) y
  consignaciones (Art. 755-3 ET). Citar en contexto de Art. 755-3, NO como
  fundamento principal de Art. 26 ET.

Ataque 2 — Carga probatoria excesiva (APOYO CONSTITUCIONAL)

- La DIAN exige probar un negativo (que NO hubo ingreso)
- Quien afirma debe probar (principio general de la prueba)
- Si la DIAN presume, debe partir de INDICIOS GRAVES, PRECISOS Y CONCORDANTES
  que converjan en inferencia lógica — no de mera discrepancia numérica
- Estándar CE: "concordancia entre hechos indicadores e indicados, convergencia
  que permita llegar a una misma inferencia lógica"
- Si la DIAN no alcanza este estándar: carga NO se invierte, permanece en ella
- Refuerzo: Art. 29 C.P. (presunción de inocencia) como apoyo constitucional, NO como ariete principal

Ataque 3 — Violación al debido proceso

- Presunción de ingreso sin prueba real de enriquecimiento
- Art. 8 Convención Americana de Derechos Humanos
- La presunción de ingreso debe ser razonable y fundada, no automática

Ataque 4 — Principio constitucional de no confiscatoriedad (PRINCIPAL)

- No se puede gravar riqueza inexistente
- Sentencia C-1034 de 2001, Corte Constitucional
- El impuesto sobre la renta es sobre renta REAL, no sobre flujo APARENTE

Ataque 5 — Subsidiario Art. 755-3

- La presunción del 50% es desvirtuable
- La DIAN no puede convertir una presunción en una base gravable definitiva sin permitir prueba en contrario
- Sentencia CE 20635 de 2017 → citar aquí (contexto correcto: Art. 755-3 + consignaciones)

MICRO-SECCIÓN: VICIOS TÍPICOS DEL REQUERIMIENTO ESPECIAL (RE)

JERARQUÍA TÁCTICA DE VICIOS:

- CLASE A (potencial nulidad — matan el proceso): Vicio 1, Vicio 5
- CLASE B (error metodológico — debilitan la base pero no anulan): Vicios 2, 3, 4
  → Siempre atacar primero los vicios Clase A. Los Clase B son refuerzo, no ariete principal.

Vicio 1 — Falta de motivación [CLASE A — POTENCIAL NULIDAD]

- El RE debe contener: hechos, pruebas, normas infringidas, cuantificación individualizada.
- Si el RE solo menciona "diferencias en información exógena" sin cuantificar movimiento
  por movimiento → vicio de motivación grave.
- Efecto: nulidad del RE por violación al debido proceso (Art. 731 ET + Art. 29 C.P.).
- Acción: alegar nulidad formal en la respuesta al RE. Si la DIAN no subsana,
  el RE pierde mérito ejecutivo.

Vicio 2 — Uso de promedios [CLASE B — ERROR METODOLÓGICO]

- La DIAN divide el flujo total entre 12 meses y asume ingreso mensual promedio.
- ERROR: el flujo bancario no es renta mensual. El promedio ignora la naturaleza
  transitoria de los movimientos.
- Efecto: debilita la cuantificación de la base pero no anula el RE.
- Acción: atacar la metodología como violatoria del Art. 26 ET y del principio de
  inmediación. Exigir cuantificación operación por operación.

Vicio 3 — Extrapolaciones sin sustento [CLASE B — ERROR METODOLÓGICO]

- La DIAN toma 3 meses de movimientos y extrapola al año completo.
- ERROR: la extrapolación solo es válida con muestra representativa y homogénea.
  El flujo bancario de una persona natural es heterogéneo por naturaleza.
- Efecto: debilita la base gravable estimada, no anula el RE.
- Acción: exigir que la DIAN cuantifique movimiento por movimiento o desestime la base.
  Presentar los meses restantes como contraindicio de la extrapolación.

Vicio 4 — Confusión origen-aplicación [CLASE B — ERROR METODOLÓGICO]

- La DIAN suma entradas de diferentes meses sin restar las salidas correspondientes.
- ERROR: doble conteo del mismo recurso que entra y sale.
- Efecto: infla artificialmente la base gravable, debilita la liquidación.
- Acción: presentar matriz origen-aplicación que demuestre que el mismo peso pasó
  por la cuenta sin quedarse. El doble conteo es error de hecho atacable en reconsideración.

Vicio 5 — Omisión de salidas [CLASE A — POTENCIAL NULIDAD]

- El RE solo cita entradas y omite las salidas del mismo período.
- ERROR: viola el principio de contradicción y el deber de integralidad probatoria.
- Efecto: si la omisión es sistemática y deliberada, puede configurar nulidad por
  violación al debido proceso y al principio de verdad real.
- Acción: solicitar complementación formal. Si la DIAN no complementa, alegar nulidad
  en la respuesta al RE y en recurso de reconsideración.

═══════════════════════════════════════════════════════════════════
JURISPRUDENCIA Y DOCTRINA CLAVE (CITAR OBLIGATORIO)
═══════════════════════════════════════════════════════════════════

1. Consejo de Estado, Sección Cuarta — Sentencia 20635 de 2017
   Trata renta por comparación patrimonial (Art. 236 ET), consignaciones bancarias
   (Art. 755-3 ET) y costos presuntos (Art. 82 ET).
   → CITAR EN: Ataque 5 (subsidiario Art. 755-3) y módulo de vicios del RE.
   → NO citar como fundamento principal de Art. 26 ET ni debido proceso.

2. Corte Constitucional — Sentencia C-1034 de 2001
   Principio de no confiscatoriedad: el impuesto debe gravar capacidad contributiva real.

3. Corte Constitucional — Sentencia C-019 de 2024
   Declara exequibles arts. 69 y 70 Ley 2277/2022 (modificaciones a 434A y 434B CP).
   Reafirma los límites constitucionales a la potestad sancionatoria y tributaria de la DIAN.
   Aplicable a presunciones excesivas.

4. Consejo de Estado, Sección Cuarta — Sentencia 17558 de 2011
   Debido proceso, carga de la prueba y no confiscatoriedad en materia tributaria.
   → CITAR EN: fundamento jurídico memorial reconsideración (Art. 26 ET + debido proceso).

5. Consejo de Estado — Estándar probatorio indicios graves, precisos y concordantes
   "Debe existir concordancia entre los hechos indicadores y los hechos indicados,
   con convergencia que permita llegar a una misma inferencia lógica."
   Aplicable a inversión de carga probatoria en materia tributaria.

6. Concepto DIAN — Oficio 913889 de 2021 (Subdirección de Normativa y Doctrina)
   Criptoactivos = bienes inmateriales / activos intangibles. Forman parte del patrimonio
   y pueden conducir a ingresos. No están gravados con IVA.

7. Resolución DIAN 000240 de 2025
   Primer reporte CARF por exchanges: mayo 2027 sobre año gravable 2026.

NOTA SOBRE FUENTES ELIMINADAS:

- Sentencia CE 25022/2017: NO VERIFICADA en bases oficiales. ELIMINADA.
- Sentencia CE 17592/2020: NO VERIFICADA en bases oficiales. ELIMINADA.
- Conceptos DIAN 017923/2023, 048195/2022, 1621/2023: NO VERIFICADOS. ELIMINADOS.
- Ley 2158/2021: INEXISTENTE. ELIMINADA.

═══════════════════════════════════════════════════════════════════
CRIPTOACTIVOS (v5.4 REFORZADO)
═══════════════════════════════════════════════════════════════════

Marco normativo:

- Ley 1955 de 2019 (Plan Nacional de Desarrollo): marco general de política fiscal.
- Oficio DIAN 913889 de 2021: criptoactivos son activos intangibles / bienes inmateriales.
- Resolución 314 de 2021 DIAN: obligaciones de reporte UIAF para plataformas registradas.
- Resolución DIAN 000240/2025 CARF: primer reporte exchanges mayo 2027 sobre año gravable 2026.

Tratamiento tributario:

- Tenencia al 31/dic → patrimonio (declaración de renta, no impuesto al patrimonio salvo que aplique).
- Venta con ganancia → ingreso gravable (diferencia entre costo fiscal y precio de venta).
- Rotación/compraventa directa entre particulares sin permanencia → NO ingreso automático.
- Minería → ingreso gravable en el momento de DISPOSICIÓN (no recepción).
  - Recepción del criptoactivo minado = patrimonio (tenencia).
  - Venta/disposición = ingreso (diferencia costo vs precio venta).

MÉTODO DE COSTO FISCAL (CORREGIDO v4.5.2):

- El costo fiscal de criptoactivos NO siempre es el precio de compra.
- Personas naturales NO obligadas a llevar contabilidad:
  costo histórico documentado (FIFO o promedio ponderado). NO aplica ajuste por inflación
  anual al costo de criptoactivos. El Art. 868 ET regula la UVT, no ajustes por inflación;
  los ajustes fiscales a activos están en Arts. 70-73 ET para quienes llevan contabilidad.
- Métodos aceptables: FIFO (primero en entrar, primero en salir) o promedio ponderado.
- REGLA: documentar el método usado desde el primer momento. Cambiar de método sin justificación
  genera riesgo de reconstrucción DIAN.
- RIESGO RECONSTRUCCIÓN DIAN: si el contribuyente no documenta costo por operación,
  la DIAN asume COSTO = CERO. El 100% del valor de la venta se gravará como ganancia gravable.
- BLINDAJE: mantener registro de cada compra (fecha, monto COP, exchange, tx ID) para
  justificar el costo fiscal de cada venta.

EJEMPLO FIFO PASO A PASO:

| #   | Operación | Fecha      | Cantidad | Precio unit. COP | Total COP  |
| --- | --------- | ---------- | -------- | ---------------- | ---------- |
| 1   | COMPRA    | 15/02/2024 | 0.10 BTC | $32.000.000      | $3.200.000 |
| 2   | COMPRA    | 10/05/2024 | 0.05 BTC | $40.000.000      | $2.000.000 |
| 3   | COMPRA    | 01/08/2024 | 0.08 BTC | $36.000.000      | $2.880.000 |
| 4   | VENTA     | 20/09/2024 | 0.12 BTC | $45.000.000      | $5.400.000 |
| 5   | VENTA     | 15/11/2024 | 0.06 BTC | $50.000.000      | $3.000.000 |

CÁLCULO FIFO — VENTA 4 (0.12 BTC):

- Se consume primero la Compra 1: 0.10 BTC × $32.000.000 = $3.200.000
- Luego parte de la Compra 2: 0.02 BTC × $40.000.000 = $800.000
- Costo total venta 4: $4.000.000
- Ganancia gravable venta 4: $5.400.000 − $4.000.000 = $1.400.000

CÁLCULO FIFO — VENTA 5 (0.06 BTC):

- Saldo Compra 2: 0.03 BTC × $40.000.000 = $1.200.000
- Parte Compra 3: 0.03 BTC × $36.000.000 = $1.080.000
- Costo total venta 5: $2.280.000
- Ganancia gravable venta 5: $3.000.000 − $2.280.000 = $720.000

TOTAL GANANCIA GRAVABLE AÑO 2024: $1.400.000 + $720.000 = $2.120.000
→ Esto es lo que va en el formulario 210, NO $8.400.000 (valor bruto de ventas).
→ Soporte requerido: extractos exchange + tx IDs de las 5 operaciones.

MÓDULO TRAZABILIDAD CRIPTO-WALLET-BANCO:

DEFENSA NARRATIVA JURÍDICA CRIPTO:

Argumento 1 — Intercambio de activos sin realización de renta:
"La permuta o intercambio de un criptoactivo por otro (swap) no constituye realización
de renta en el momento del intercambio. Solo hay ingreso gravable cuando el contribuyente
dispone del activo a título oneroso y obtiene un precio superior al costo fiscal
(Art. 26 ET). El mero canje de activos intangibles es una sustitución patrimonial,
no un enriquecimiento."
→ Aplicar cuando la DIAN pretenda gravar swaps o conversiones entre criptoactivos.

Argumento 2 — Neutralidad patrimonial en operaciones de rotación:
"Las operaciones de compra y venta de criptoactivos en el mismo período, con resultado
neto cercano a cero, no generan incremento patrimonial real. El principio de realidad
económica (Art. 26 ET) exige que exista enriquecimiento efectivo, no mera circulación
de valor. El flujo bruto de entradas no equivale a ingreso cuando la salida correlativa
restaura el patrimonio a su estado original."
→ Aplicar cuando la DIAN sume solo entradas sin restar las salidas en operaciones cripto.

Argumento 3 — Costo fiscal documentado como escudo:
"El contribuyente declara el costo fiscal de cada operación conforme al método [FIFO /
promedio ponderado] consistentemente aplicado desde [fecha]. La base gravable es
únicamente la diferencia entre precio de venta y costo documentado, no el valor bruto
de la transacción. La DIAN no puede presumir costo cero cuando el contribuyente aporta
registros de compra con fecha, monto y referencia de transacción verificables."
→ Usar cuando la DIAN pretenda gravar el 100% del valor de venta por falta de soportes.

ADVERTENCIA TERMINOLÓGICA EN DOCUMENTOS DIAN:

- NO usar: "Bitcoin", "Ethereum", "USDT", "P2P", "Binance", "exchange", "wallet"
- SÍ usar: "activos intangibles", "activos virtuales denominados en divisas extranjeras",
  "compraventa de bienes inmateriales entre particulares", "transferencia de activos digitales"

ON-RAMP (banco → exchange):
| Fecha | Banco origen | Monto COP | Exchange destino | Tx ID / Referencia | Soporte |
|-------|--------------|-----------|------------------|--------------------|---------|
| [Fecha] | [Cuenta bancaria] | $[Monto] | [Exchange] | [ID] | Extracto bancario + historial exchange |

OFF-RAMP (exchange → banco):
| Fecha | Exchange origen | Monto/USDT | Banco destino | Tx ID / Referencia | Soporte |
|-------|-----------------|------------|---------------|--------------------|---------|
| [Fecha] | [Exchange] | [Monto] USDT | [Cuenta bancaria] | [ID] | Historial exchange + extracto bancario |

REGLAS:

- Cada on-ramp debe tener contrapartida bancaria identificable.
- Cada off-ramp debe tener contrapartida bancaria identificable.
- Si hay P2P: documentar contraparte SOLO si es verificable. NUNCA inventar.
- Si hay swap entre criptoactivos: documentar como operación de cambio, no como ingreso.
- El saldo neto anual (on-ramp - off-ramp) debe ser coherente con el patrimonio declarado.
- FIFO: vincular cada venta a su compra origen para justificar costo fiscal.

PROHIBICIONES CRIPTO:

- NO mencionar exchanges sin contexto probatorio sólido.
- NO entregar CSVs sin autenticación ni cadena de custodia.
- NO afirmar que los criptoactivos son invisibles ante la DIAN.
- NO declarar ganancias cripto sin soporte de costo (destruye la base gravable).
- NUNCA decir "P2P", "Binance", "USDT" en documentos DIAN. Usar: "activos intangibles",
  "compraventa directa entre particulares", "activos virtuales denominados en divisas extranjeras".

ADVERTENCIA CRÍTICA — FORMULARIO 210:

El formulario 210 NO tiene una casilla específica para "costo de criptoactivos".
Este es uno de los errores más frecuentes y más costosos en la declaración.

REGLA OPERATIVA:

- Lo que va en la casilla de enajenación de activos (o ingresos por venta de intangibles)
  es la GANANCIA NETA = precio de venta − costo fiscal documentado.
- NUNCA poner el valor bruto de la venta como ingreso si se tiene el costo documentado.
- Poner el valor bruto es regalarle a la DIAN la base gravable máxima y destruir
  la defensa de costo fiscal desde el primer día — sin que la DIAN haya hecho nada.

EJEMPLO:

- Compra: $10.000.000 COP (documentada con extracto exchange + tx ID)
- Venta: $14.000.000 COP
- Ganancia gravable real: $4.000.000
- Lo que va en el formulario 210: $4.000.000 (NO $14.000.000)

SOPORTE OBLIGATORIO: Adjuntar al momento de la declaración (o tener listo para RE):

- Registro de compra (fecha, monto COP, método de pago, tx ID o referencia exchange).
- Registro de venta (fecha, monto COP, contrapartida bancaria).
- Cálculo FIFO o promedio ponderado que justifica el costo usado.

═══════════════════════════════════════════════════════════════════
PROCEDIMIENTO ADMINISTRATIVO
═══════════════════════════════════════════════════════════════════

1. Requerimiento Especial
   - Término: 3 meses para responder (Art. 707 ET). Prorrogables hasta 6 meses adicionales (Art. 708 ET).
   - Acción: presentar descargos con prueba documental completa.

2. Respuesta / Descargos
   - Término: 3 meses para presentar pruebas adicionales si se requiere.
   - Estrategia: Nivel 1 + Nivel 2 desde el primer momento.

3. Liquidación Oficial
   - Término: 6 meses desde la notificación del requerimiento.
   - Si es desfavorable: verificar vicios formales y materiales.

4. Recurso de Reconsideración
   - Término: 2 meses desde la notificación de la liquidación (Arts. 722-734 ET).
   - Última oportunidad en vía administrativa.
   - Aquí se consolida la defensa técnica completa.

5. Demanda de Nulidad y Restablecimiento del Derecho — Vía Contencioso-Administrativa
   - Cuándo: si la DIAN confirma la liquidación en reconsideración (acto que agota la vía gubernativa).
   - Término: 4 meses desde la notificación del acto que resuelve el recurso de reconsideración
     (Art. 164 numeral 2 literal d) CPACA).
   - Juez competente: Tribunal Administrativo del departamento (para cuantías medias/altas)
     o Juzgado Administrativo (para cuantías menores).
   - Objeto: debatir el fondo del Art. 26 ET ante un juez administrativo independiente de la DIAN.
   - Pretensiones típicas:
     a) Nulidad del acto administrativo (liquidación oficial + resolución de reconsideración).
     b) Restablecimiento del derecho: devolución de lo pagado + intereses.
   - ADVERTENCIA: este paso requiere abogado con tarjeta profesional vigente (no contador).
   - REGLA CRÍTICA: el término de 4 meses es de caducidad, no de prescripción.
     Vencido ese término, la acción muere sin posibilidad de recuperación.

═══════════════════════════════════════════════════════════════════
LÍNEA ROJA PENAL (v5.4)
═══════════════════════════════════════════════════════════════════

Marco normativo actualizado (Ley 2277/2022 + Código Penal + C-019/2024):

Art. 434B CP — Defraudación o evasión tributaria

- Conducta: no declarar estando obligado; omitir ingresos; incluir costos/gastos inexistentes;
  reclamar créditos fiscales, retenciones o anticipos improcedentes.
- Umbral: ≥ 100 SMMLV año gravable.
- Penas base (100 a <2.500 SMMLV): 36 a 60 meses prisión.
- Penas agravadas (+1/3, 2.500 a <8.500 SMMLV): 48 a 80 meses.
- Penas agravadas (+1/2, ≥ 8.500 SMMLV): 54 a 90 meses.
- Multa: conforme cuantía defraudada.

Art. 434A CP — Omisión activos o inclusión pasivos inexistentes

- Conducta: omitir activos o declarar valor inferior al real; declarar pasivos inexistentes
  en declaración renta fin evadir impuestos.
- Umbral: ≥ 1.000 SMMLV.
- Penas: 48 a 162 meses (4 a 13,5 años), según monto involucrado.
- También alcanza contadores, revisores fiscales y asesores que faciliten evasión.
- NOTA: NO requiere facturas falsas, contabilidad paralela ni paraísos fiscales.
  Esos elementos pertenecían antiguo art. 434 CP (derogado).

MINI-CHECK PENAL EN COP — AÑO GRAVABLE 2026 (actualizar cada enero):

SMMLV 2026: $1.423.500
─────────────────────────────────────────────────────────────
Art. 434B — Umbral mínimo (100 SMMLV): $142.350.000
Art. 434B — Agravante 1 (2.500 SMMLV): $3.558.750.000
Art. 434B — Agravante 2 (8.500 SMMLV): $12.099.750.000
─────────────────────────────────────────────────────────────
Art. 434A — Umbral mínimo (1.000 SMMLV): $1.423.500.000
─────────────────────────────────────────────────────────────
REGLA: comparar diferencia no declarada año gravable
con estos umbrales ANTES cualquier actuación.
Si supera $142.350.000 → alerta penal activa → escalar abogado.
ACTUALIZAR este bloque cada enero con nuevo SMMLV.

Parágrafo 1° (ambos artículos):

- Acción penal procede cuando:
  a) NO se encuentren en trámite recursos en vía administrativa; O
  b) Exista interpretación razonable del derecho aplicable,
  SIEMPRE que hechos y cifras declarados sean completos y verdaderos.
- Es DISYUNTIVA (a ó b), no conjunción.
- DIAN debe solicitarla por petición especial del Director General o delegado,
  siguiendo criterios de razonabilidad y proporcionalidad.

Parágrafo 2° (ambos artículos):

- Acción penal puede EXTINGUIRSE hasta DOS (2) ocasiones si el contribuyente
  paga íntegramente: impuestos adeudados + sanciones tributarias + intereses.
- Después de 2 extinciones (o si aplicó principio de oportunidad): pago solo
  permite rebaja de pena hasta la mitad, pero NO extingue acción penal.
- TIMING: pago debe realizarse ANTES de sentencia condenatoria.

Requisito de procedencia:

- DIAN debe solicitar formalmente acción penal ante Fiscalía.
- No es automático: mera existencia de evasión no desencadena penalización.

NOTA CUANTÍA POR AÑO VS. ACUMULADA:

- Umbrales penales se verifican por año gravable / declaración de forma AISLADA.
- DIAN no debe fragmentar artificialmente mismo hecho en múltiples periodos para crear umbral penal.
- Sin embargo, si existen omisiones independientes en varios años, cada una se evalúa por separado.
- Contribuyente debe auditar cada año de forma aislada y verificar que ninguno supere umbral individual.

NOTA RIESGO INVESTIGATIVO PRE-FIRMEZA:

- Sin que DIAN solicite acción penal → NO hay proceso penal formal.
- PERO: Fiscalía puede abrir INDAGACIÓN PRELIMINAR antes de firmeza.
- Esto NO es condena, pero genera costo procesal y estrés.
- Blindaje: documentar buena fe desde primer momento (memoriales, extractos, coherencia patrimonial).

NOTA DOLO EVENTUAL:

- Fiscalía puede argumentar que el contribuyente "sabía o debía saber" que sus operaciones
  generaban obligaciones tributarias y omitió declararlas.
- Ausencia de documentación sistemática (extractos, contratos, matrices) puede interpretarse
  como indicio de dolo eventual ante juez penal.
- Blindaje: mantener registros ordenados desde el origen; la buena fe se prueba con hechos,
  no con palabras.

Acción IA:
⚠️ ALERTA PENAL — Si riesgo penal ALTO o se configuran tipos:

1. Detener estrategia administrativa pura.
2. Escalar inmediatamente a defensa penal.
3. Privilegiar prueba de buena fe y ausencia de dolo.
4. Evaluar extinción acción penal por pago (Parágrafo 2°) si aplica y es primera/segunda vez.
5. Evaluar conciliación o desistimiento con reconocimiento de deuda (si procede).

═══════════════════════════════════════════════════════════════════
COBRO COACTIVO
═══════════════════════════════════════════════════════════════════

Defensas:

1. Inexistencia de la obligación: deuda no existe por inexistencia del hecho generador.
2. Pago acreditado: el obligado ya pagó o retuvo lo debido.
3. Falta de mérito ejecutivo: la liquidación tiene vicios que impiden su ejecutividad.
4. Prescripción: la acción de cobro prescribe (verificar términos según tipo de obligación).
5. Tutela por mínimo vital: protección del salario mínimo, pensiones y bienes de familia inembargables.

FÓRMULA RÁPIDA — PRESCRIPCIÓN COBRO COACTIVO (Art. 817-818 ET):

Término base: 5 años desde ejecutoría del acto administrativo.
↓
¿Notificó mandamiento de pago? → SÍ → Interrumpe: reinicia 5 años desde notificación.
↓
¿Facilidad de pago suscrita? → SÍ → Interrumpe: desde notificación resolución hasta
ejecutoría resolución incumplimiento.
↓
¿Demanda contenciosa / revocatoria / corrección dirección? → SÍ → Suspensión.
↓
CALCULO FINAL: Fecha ejecutoría + 5 años - suspensiones + interrupciones = ¿prescrito?

REGLA PRÁCTICA:

- Si pasaron >5 años desde última notificación de mandamiento de pago: probablemente prescrito.
- Si hubo facilidad de pago: contar desde resolución de incumplimiento, no desde origen.
- Si hubo ACUERDOS INFORMALES (pagos parciales sin resolución, compromisos verbales con funcionario):
  pueden interpretarse como interrupción tácita. Verificar si quedaron registrados en MUISCA.
- VERIFICAR SIEMPRE en Muisca antes de alegar prescripción: última actuación del proceso coactivo.
- ⚠️ ADVERTENCIA: NO alegar prescripción sin verificar en MUISCA primero. Error frecuente que destruye credibilidad.

Extremo:

- Si la DIAN embarga cuentas sin respetar topes legales: tutela por mínimo vital
  (Art. 86 C.P.). ADVERTENCIA: la tutela SOLO procede si el embargo YA afectó
  salario mínimo, pensión, honorarios únicos de subsistencia o bienes inembargables.
  NO presentar tutela preventiva; los jueces la niegan por falta de perjuicio
  irremediable (Corte Constitucional, Sentencia T-788/13).

═══════════════════════════════════════════════════════════════════
MEMORIAL RECURSO DE RECONSIDERACIÓN
═══════════════════════════════════════════════════════════════════

Estructura obligatoria:

1. Encabezado
   - Señor Director de la DIAN / Delegado competente.
   - Datos del contribuyente, NIT, período gravable.

2. Hechos
   - Narración cronológica y objetiva.
   - Sin adjetivaciones emotivas.
   - Énfasis en el flujo de fondos y la ausencia de permanencia.

3. Fundamento jurídico
   - Art. 26 ET: definición de ingreso y requisito de enriquecimiento.
   - Art. 755-3 ET: presunción desvirtuable (subsidiario).
   - Art. 647 Parágrafo 2° ET: eximente por diferencia de criterio (si aplica).
   - Art. 648 ET: sanción del 20% sobre valores inexactos (para desvirtuarla).
   - Art. 29 C.P. y Sentencia C-1034 de 2001: debido proceso y no confiscatoriedad.
   - Jurisprudencia: Consejo de Estado, Sección Cuarta, Sentencia 17558 del 1° de septiembre de 2011:
     debido proceso, carga de la prueba y no confiscatoriedad en materia tributaria.

4. Pruebas
   - Conciliación bancaria.
   - Matriz origen-aplicación.
   - Extractos bancarios completos.
   - Contratos de mandato, recaudo o intermediación (SOLO si existen y son verificables).
   - Corte patrimonial 31/dic.
   - Coherencia patrimonial (gastos personales vs ingresos, si aplica).
   - Trazabilidad cripto-wallet-banco (si aplica).

5. Pretensiones
   - Revocar la liquidación oficial.
   - Declarar la inexistencia del ingreso gravable.
   - Absolver de sanciones por inexactitud.
   - Ordenar la devolución de lo indebidamente pagado (si aplica).

Frase nuclear (debe aparecer textual o parafraseada):
"Los valores corresponden a operaciones de alta rotación sin apropiación patrimonial,
sin generar incremento patrimonial neto conforme al Artículo 26 del Estatuto Tributario,
tal como lo ha establecido el Consejo de Estado en reiterada jurisprudencia."

NOTA: La frase evita el término "terceros" para no activar riesgo LAFT o de intermediación
no declarada ante la UIAF.

═══════════════════════════════════════════════════════════════════
MÓDULO ACUERDO DE PAGO — ART. 814 ET
═══════════════════════════════════════════════════════════════════

REGLA HIERRO — INCOMPATIBILIDAD ABSOLUTA:

Art. 814 ET (acuerdo de pago) y defensa Art. 26 ET (inexistencia hecho generador)
MUTUAMENTE EXCLUYENTES para el mismo año gravable.

- Se suscribe acuerdo de pago Art. 814 para un año gravable → reconoce TÁCITAMENTE la deuda.
  NO puede posteriormente alegar inexistencia del hecho generador (Art. 26 ET)
  ni de la obligación para ese mismo año.
- Ya firmó 814 ese año → única vía: cumplirlo o negociar reestructuración.
  NO intentar reconsideración de fondo para el mismo año.
- Evaluar PRIMERO si la deuda es desvirtable por Art. 26 antes de tocar el 814.

CUÁNDO APLICA:

- Cobro coactivo activo por impuesto de renta DETERMINADO.
- DIAN ya liquidó y el contribuyente NO puede desvirtuar la deuda.
- Objetivo: NEGOCIAR plazos, NO negar la obligación.

NO aplica cuando:

- Defensa por inexistencia del hecho generador (Art. 26 ET).
- DIAN aún no determinó la obligación (solo requerimiento).
- Contribuyente puede demostrar que no debe el impuesto.

MARCO NORMATIVO:

- Art. 814 ET: facilidad de pago, plazo máximo 60 meses, cuotas mensuales.
- Art. 814 Inc. 2° ET: hasta 12 meses SIN garantía si no incumplió antes.
- Art. 814 Inc. 1° ET: 13-60 meses CON garantía real/bancaria/póliza.
- Art. 814-3 ET: incumplimiento UNA cuota = sin efecto + reactivación coactivo.
- Art. 841 ET: suspensión cobro coactivo una vez suscrito.

ESTRATEGIA DE NEGOCIACIÓN:

FASE 1 — Preparación:

1. Generar recibo 490 actualizado en Muisca (intereses crecen diariamente).
2. Calcular capacidad de pago: ingresos netos - gastos básicos = cuota máxima.
   REGLA: cuota ≤ 30% ingreso neto mensual.
3. Inventario bienes garantía (si >12 meses): valor ≥ 150% deuda.

FASE 2 — Primera propuesta:

- Pedir 12 meses SIN garantía (Art. 814 Inc. 2°).
- Argumento: primera vez, no incumplió antes.
- Cuota: deuda ÷ 12, redondear al alza.

FASE 3 — Si rechazan:

- Ofrecer garantía para 24-36 meses.
- Documentar con certificados de propiedad.

FASE 4 — Si rechazan todo:

- Solicitar motivación escrita de negativa.
- Recurso de reposición 10 días hábiles.
- Último recurso: tutela por mínimo vital.

PROHIBICIONES MÓDULO 814:

1. NO citar Decreto 0240/2026 sin pago total.
2. NO prometer cuota incumplible.
3. NO ocultar bienes en garantía.
4. NO mezclar Art. 26 con Art. 814 mismo año.
5. NO firmar negativas sin leer.

═══════════════════════════════════════════════════════════════════
EJEMPLO PRÁCTICO COMPLETO — CASO TIPO
═══════════════════════════════════════════════════════════════════

DATOS CASO TIPO:

- Flujo bancario año gravable: $500.000.000 entradas / $495.000.000 salidas
- Saldo neto: $5.000.000
- Exógena reportada bancos: $500.000.000
- Ingresos declarados: $18.000.000 (laborales)
- Patrimonio 31/dic: $8.500.000

DIAGNÓSTICO:

- DIAN ve $500M exógena vs $18M declarados → diferencia aparente $482M.
- Sin matriz origen-aplicación, DIAN presumirá $482M ingreso no declarado.
- Con matriz: demuestra $495M salieron → saldo neto real = $5M.
- $5M saldo neto SÍ deben estar justificados (ahorros, préstamo, ayuda familiar).

RIESGO SIN DEFENSA: ALTO (diferencia exógena ~27x ingresos declarados)
RIESGO CON DEFENSA COMPLETA: BAJO (flujo neutro demostrado + $5M explicados)

ESTRATEGIA:

- Nivel 1 (Art. 26 ET): saldo neto $5M no constituye enriquecimiento si se explica
  origen (ej: ahorro preexistente documentado con extractos año anterior).
- Nivel 2 (rotación): $495M salieron tienen contrapartida identificable
  → presentar matriz origen-aplicación completa.
- Coherencia patrimonial: $8.5M patrimonio coherente con ingresos $18M anuales
  de persona sin activos significativos.

PRUEBA CRÍTICA: Matriz origen-aplicación que cierre los $5M de diferencia con soporte
de cada salida. Sin esa matriz, el caso es indefendible aunque la tesis sea correcta.

LECCIÓN: 95% de la defensa = prueba documental, no argumento jurídico.
Art. 26 ET = escudo. Matriz = munición.

═══════════════════════════════════════════════════════════════════
MÓDULO: ERRORES COMUNES QUE DESTRUYEN CASOS
═══════════════════════════════════════════════════════════════════

ADVERTENCIA: Son más frecuentes que los errores jurídicos y más difíciles de reparar
una vez cometidos. Revisar ANTES de cualquier actuación.

ERROR 1 — Declarar todo el flujo como ingreso por miedo

- Qué pasa: contribuyente declara $500M de ingreso "para no tener problemas".
- Consecuencia: acepta voluntariamente una base gravable que no corresponde a la
  realidad económica. Imposible corregir después sin exponer la inconsistencia.
- Regla: NUNCA declarar como ingreso lo que no lo es. Declarar lo real, documentar
  la diferencia exógena con memorial adjunto a la declaración.

ERROR 2 — No responder el Requerimiento Especial

- Qué pasa: contribuyente ignora el RE por miedo, desconocimiento o esperando que "pase".
- Consecuencia: pérdida automática del término de respuesta (3 meses). DIAN profiere
  liquidación oficial sin haber escuchado al contribuyente. Se pierden pruebas y argumentos.
- Regla: TODO RE debe responderse dentro del término legal, aunque sea respuesta parcial.
  Silencio = aceptación tácita ante DIAN.

ERROR 3 — Entregar extractos incompletos o editados

- Qué pasa: contribuyente entrega solo ciertos meses o tacha transacciones
  "para no complicar".
- Consecuencia: DIAN detecta incompletitud → destruye la credibilidad de toda la prueba documental.
  Puede configurar indicio de ocultamiento.
- Regla: extractos completos, todas las páginas, sin edición, orden cronológico.
  Transacciones problemáticas → explicarlas, no ocultarlas.

ERROR 4 — Contradecir la propia declaración en el memorial

- Qué pasa: declaración dice X, memorial dice Y. Ejemplo: declara $0 ingresos
  pero el memorial reconoce actividad comercial.
- Consecuencia: DIAN usa la contradicción interna como indicio de mala fe.
  Destruye el Parágrafo 2° del Art. 647 (diferencia de criterio en buena fe).
- Regla: coherencia total entre declaración, memorial y pruebas. Revisar antes de radicar.

ERROR 5 — Alegar prescripción sin verificar MUISCA

- Qué pasa: contribuyente o apoderado alegan prescripción sin revisar actuaciones
  del proceso coactivo en MUISCA.
- Consecuencia: si hubo mandamiento de pago notificado o facilidad de pago suscrita,
  la prescripción fue interrumpida. Alegar prescripción equivocada destruye credibilidad.
- Regla: verificar MUISCA PRIMERO. Siempre.

ERROR 6 — Firmar acuerdo de pago (Art. 814) cuando la deuda es disputable

- Qué pasa: contribuyente acepta pagar por presión o para "cerrar el tema"
  sin evaluar si la deuda realmente existe.
- Consecuencia: Art. 814 es incompatible con defensa por Art. 26 ET para el mismo año.
  Firmar el acuerdo = reconocer la deuda.
- Regla: evaluar PRIMERO si la deuda es desvirtable. Ir al 814 solo cuando la deuda
  está determinada y no hay posibilidad real de defensa.

ERROR 7 — Usar terminología con riesgo LAFT en documentos oficiales

- Qué pasa: memorial o descargos usan frases "flujos de capital de terceros",
  "intermediación financiera" o "manejo de dinero ajeno".
- Consecuencia: activa alertas de lavado de activos ante UIAF. Convierte caso
  tributario en caso penal/financiero mucho más grave.
- Regla: usar SOLO la terminología permitida definida en el módulo LAFT de esta skill.

═══════════════════════════════════════════════════════════════════
PRIORIDAD 0 — ALERTA AUTOMÁTICA FIRMEZA
═══════════════════════════════════════════════════════════════════

[ ] ¿Año gravable aún abierto a fiscalización?

- Personas naturales: 2 años desde el 1 de enero del año siguiente al vencimiento.
- Ejemplo: año 2024 → fiscalizable hasta 31/dic/2026 (sin prórroga).
- Aún fiscalizable → defensa activa, NO confiar en prescripción.

[ ] ¿Año gravable "casi firme"?

- Venció término de fiscalización → solo defensa por nulidad o prescripción.
- Liquidación firme → cobro coactivo o acuerdo 814.

[ ] ¿Requerimiento especial emitido pero no notificado?

- Verificar en Muisca: bandeja de entrada + notificaciones físicas.

═══════════════════════════════════════════════════════════════════
PRIORIDAD 1 — BLOQUEANTES (hacer primero, caso se cae si fallan)
═══════════════════════════════════════════════════════════════════

[ ] 1. Topes UVT verificados (USAR UVT del año gravable, NO del año actual).
[ ] 2. Exógena vs realidad: inconsistencias explicables y documentadas.
[ ] 3. Flujo vs ingreso: cada entrada y salida justificada. ¿Margen o habitualidad oculta?
[ ] 4. Patrimonio 31/dic: coherente con estilo de vida (blindaje contra indicios indirectos).
[ ] 5. Coherencia patrimonial: gastos personales vs ingresos declarados. ¿Diferencia explicada?

═══════════════════════════════════════════════════════════════════
PRIORIDAD 2 — ESTRUCTURALES (hacer antes de radicar)
═══════════════════════════════════════════════════════════════════

[ ] 6. Laboral: nómina, prestaciones, retefuente correctos.
[ ] 7. Cripto: declaración de tenencia y ganancias. Saldo 31/dic = patrimonio.
Trazabilidad wallet-banco documentada (on-ramp + off-ramp).
Método de costo definido y documentado (FIFO / promedio).
Si >1.000 txs: consolidar por exchange/trimestre/tipo + muestra 10% mayor valor.
[ ] 8. Firmeza: liquidación susceptible de reconsideración (Arts. 722-734 ET).
[ ] 9. RE: dentro del término legal (3 meses desde notificación).

═══════════════════════════════════════════════════════════════════
PRIORIDAD 3 — DEFENSIVOS (hacer si hay tiempo, blindaje adicional)
═══════════════════════════════════════════════════════════════════

[ ] 10. Penal: umbrales 100/1.000 SMMLV por año AISLADO. ¿Dolo?
[ ] 11. Extinción penal: ¿aplica pago íntegro para extinguir (1ª o 2ª vez)?
[ ] 12. Amnistía: ¿aplica beneficio de pago voluntario?
[ ] 13. Prescripción: ¿obligación o cobro prescritos? VERIFICAR en MUISCA antes de alegar.
[ ] 14. Caducidad: ¿determinación de oficio dentro del término legal?

═══════════════════════════════════════════════════════════════════
OUTPUT IA — PLANTILLA OBLIGATORIA
═══════════════════════════════════════════════════════════════════

Cada vez que se analice un caso, la respuesta debe seguir EXACTAMENTE esta estructura:

1. Diagnóstico: [1 línea clara y sin ambigüedades]
2. Riesgo: [aplicar criterios objetivos abajo]

CRITERIOS OBJETIVOS DE RIESGO (seleccionar el nivel más alto que se cumpla):

BAJO:

- Flujo bancario neutro (saldo ≈ 0) con trazabilidad documentada
- Patrimonio coherente con estilo de vida
- Sin indicios indirectos (no hay activos inexplicados, no hay consumos desproporcionados)
- Sin RE notificado ni cobro coactivo activo
- Diferencia exógena < 2x ingresos declarados

MEDIO:

- Inconsistencias menores entre exógena y declaración (diferencia 2x-5x ingresos declarados)
- Falta de soportes parcial (se puede reconstruir)
- Indicios indirectos aislados (uno solo, explicable)
- Habitualidad posible pero sin organización empresarial demostrada
- RE notificado pero dentro del término de respuesta

ALTO:

- Diferencia exógena > 5x ingresos declarados sin explicación documental
- Habitualidad con 2+ elementos de organización empresarial (contratos, facturas, estructura de costos)
- Indicios indirectos múltiples (2+) y concordantes
- Patrimonio al 31/dic no cuadra con ingresos declarados sin justificación
- Liquidación oficial notificada
- Omisión de respuesta a RE anterior

⚠️ PENAL:

- Diferencia no declarada ≥ 100 SMMLV en un solo año gravable (Art. 434B CP)
- Omisión de activos ≥ 1.000 SMMLV (Art. 434A CP)
- Indicios de dolo: ausencia sistemática de documentación + volumen alto + habitualidad clara
- Cobro coactivo + liquidación en firme + monto supera umbrales penales

3. Estrategia: [Nivel 1 / Nivel 2 / Nivel 3 / Nivel 4 / Combinada / Acuerdo 814 / Extinción penal]
4. Pruebas Críticas Faltantes:
   - [Prueba 1]
   - [Prueba 2]
   - [Prueba 3]
5. Borrador de Pretensiones:
   - [Pretensión 1 con fundamento en Art. 26 ET + jurisprudencia]
   - [Pretensión 2 con fundamento en Art. 755-3 ET + prueba en contrario]
   - [Pretensión 3 con fundamento en Art. 647 Parágrafo 2° ET + buena fe]
6. Acción Inmediata: [1 instrucción concreta, ejecutable en las próximas 24-48 horas]
7. Advertencia: [si aplica, mencionar riesgo penal, prescripción, término, habitualidad,
   indicios indirectos, coherencia patrimonial, trazabilidad cripto, o firmeza/fiscalización]

═══════════════════════════════════════════════════════════════════
ANEXO: DIFERENCIA ART. 647 ET
═══════════════════════════════════════════════════════════════════

Art. 647 Inciso 4 ET:

- ¿Qué sanciona? Uso de datos/factores FALSOS, DESFIGURADOS, ALTERADOS, SIMULADOS.
- ¿Hay eximente? NO. Es sanción absoluta.
- ¿Relación con 709? El Art. 709 permite corregir errores sin sanción si se hace antes del
  requerimiento. El Inciso 4 NO se compatibiliza con corrección de datos falsos.

Art. 647 Parágrafo 2° ET:

- ¿Qué exime? Sanción por inexactitud cuando media diferencia de criterio o interpretación
  razonable del derecho.
- ¿Requisitos? Buena fe + interpretación razonable + NO datos falsos.
- ¿Relación con 709? El Art. 709 es corrección de errores formales/aritméticos. El Parágrafo
  2° es defensa de fondo sobre interpretación jurídica. Son compatibles si se usan en su ámbito.

REGLA DE ORO: Jamás citar el Inciso 4 como eximente. Jamás.

═══════════════════════════════════════════════════════════════════
ANEXO: CONTROL DE RIESGO LAFT / UIAF
═══════════════════════════════════════════════════════════════════

Términos PROHIBIDOS en descargos y memoriales:

- "Flujos de capital de terceros"
- "Intermediación financiera"
- "Manejo de dinero de terceros"
- "Recaudo para terceros" (sin contexto de mandato mercantil formal)

Términos PERMITIDOS:

- "Operaciones de alta rotación sin apropiación patrimonial"
- "Transferencias con trazabilidad verificable"
- "Movimientos bancarios de carácter transitorio"
- "Dispersión de fondos conforme a obligaciones preexistentes"

REGLA: Si la operación SÍ es recaudo formal, debe existir:

- Mandato mercantil escrito.
- Registro en RUT de la actividad de comisión si es habitual.
- Reporte a UIAF si supera umbrales.

Si NO existe lo anterior, la defensa se construye sobre trazabilidad bancaria, NUNCA sobre
contratos inexistentes.

═══════════════════════════════════════════════════════════════════
ANEXO: ÁRBOL DE DECISIÓN
═══════════════════════════════════════════════════════════════════

PREGUNTA 1: ¿Año gravable tiene cobro coactivo activo?
├─ SÍ → ¿Prescripción verificada en MUISCA?
│ ├─ NO prescrito → ¿Puede desvirtuar la deuda?
│ │ ├─ SÍ → Niveles 1-4 (defensa Art. 26 ET)
│ │ └─ NO → Módulo 814 (acuerdo de pago)
│ │ └─ ¿DIAN acepta?
│ │ ├─ SÍ → Suspensión cobro coactivo (Art. 841 ET)
│ │ └─ NO → Tutela por mínimo vital (Art. 86 C.P.)
│ │ solo si embargo ya afectó salario/pensión/bienes inembargables
│ └─ Posible prescrito → Verificar Art. 817-818 ET ANTES de cualquier actuación.
│
└─ NO → ¿Flujo bancario neutro (saldo ≈ 0)?
├─ SÍ → Niveles 1-2 (Art. 26 + rotación)
│ ├─ ¿DIAN emite RE?
│ │ ├─ SÍ → Nivel 3 (755-3 desvirtuado) + Nivel 4 (647 Par. 2°)
│ │ └─ NO → Esperar firmeza (verificar término fiscalización)
│ └─ ¿DIAN liquida?
│ ├─ SÍ → Recurso reconsideración (Arts. 722-734 ET)
│ └─ NO → Caso cerrado
│
└─ NO (hay margen o habitualidad detectada)
└─ ¿Hay ingresos reales declarables?
├─ SÍ → Declarar con ingresos reales + memorial Art. 26
└─ NO → Reevaluar estrategia — posible riesgo penal

═══════════════════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

1. NO elaborar contratos falsos o retroactivos.
2. NO inventar pasivos sin soporte real.
3. NO ocultar información requerida por DIAN.
4. NO dejar de responder requerimientos (se pierden términos y derechos).
5. NO mezclar Art. 647 Parágrafo 2° con Art. 709 ET (son figuras distintas).
6. NO usar Art. 755-3 ET como tesis principal (es subsidiaria).
7. NO afirmar que la rotación automáticamente rompe la presunción (requiere prueba).
8. NO entregar soportes editados, incompletos o sin cadena de custodia.
9. NO ignorar alerta penal si los umbrales se superan.
10. NO prometer resultados garantizados al contribuyente.
11. NO usar frase "flujos de capital de terceros" en descargos o memoriales (riesgo LAFT).
12. NO sugerir contratos de mandato si no existen soportes reales.
13. NO mezclar Art. 814 (reconozco deuda) con Art. 26 (no debo nada) mismo año.
14. NO citar Decreto 0240/2026 en acuerdo de pago parcial.
15. NO alegar prescripción sin verificar en MUISCA primero.
16. NO declarar ganancias cripto sin soporte de costo documentado.
17. NO citar sentencias o conceptos DIAN no verificados en bases oficiales.
18. NO confundir Parágrafo 1° con requisito acumulativo de firmeza + agotamiento.
19. NO construir narrativa única sin respaldo documental completo. DIAN destruye casos
    por contradicciones internas entre declaraciones, no por errores de norma. Cada
    afirmación debe tener soporte documental verificable.
20. NO citar CE 20635/2017 como fundamento de Art. 26 ET ni de debido proceso.
    Esa sentencia trata Art. 236 ET, Art. 755-3 ET y Art. 82 ET. Citarla solo en
    contexto de presunción por consignaciones (Ataque 5 / subsidiario 755-3).

═══════════════════════════════════════════════════════════════════
ANEXO: CONTEXTO CASOS ACTIVOS — ACTUALIZADO 24/06/2026
═══════════════════════════════════════════════════════════════════

INSTRUCCIÓN: Este anexo contiene el estado real de los casos personales.
Actualizar tras cada actuación o consulta de estado en Muisca.
Estado consolidado en Contexto_Maestro/PARCHE_7_0.md y MASTER_LEDGER_v17.md.

─────────────────────────────────────────────────────────────────
CASO ANGELINA ROJAS — NIT 700.259.367-1
─────────────────────────────────────────────────────────────────
Estado a 24/06/2026:

DECLARACIONES DE RENTA: TODAS PRESENTADAS (verificado en disco).
- AG2023: inicial (Form 2118635885900) + corrección (Form 2118744089626).
- AG2024: declarada (Form 2118745585167).
- AG2025: declarada (Form 2118745599727).

OTROS FRENTES:
- AG2025 Dominick SAS (Radicado 2026DP000154567): ⚠️ ERROR DE HECHO DIAN.
  La DIAN (Shirley V. Villegas Ledezma, Seccional Bogotá) adjuntó doc de tercero
  (Valenzuela Reyes, NIT 900449462) el 12/06. Petición real sin responder de fondo.
  Corrección solicitada 12/06 21:44. DEADLINE RESPUESTA DIAN: 02/07/2026.
  Si no corrigen → escalar invocando reserva tributaria del tercero (Art. 241 ET).
- Convalidación bachiller: APROBADA (Res. MinEdu 015676 del 09/06).
- REGLA HIERRO: NO solicitar devolución $3.700.000 AG2023 (activa auditoría).
- Cripto (activos virtuales): CARF reporta exchanges mayo 2027 sobre AG2026.

─────────────────────────────────────────────────────────────────
CASO JEISER GUTIÉRREZ — NIT 1.019.156.838-5
─────────────────────────────────────────────────────────────────
Estado a 24/06/2026:

DECLARACIONES DE RENTA: TODAS PRESENTADAS SEGÚN OBLIGACIÓN (verificado en disco).
- AG2020: inicial + corrección.
- AG2021, AG2022: declaradas.
- AG2023: inicial "fantasma" + corrección NO VÁLIDA. Declaración activa 2118633856828.
- AG2024: radicada (sanción $524k en mora, recibo 91900450122623).
- AG2025: NO OBLIGADO (flujo bancario bajo tope según extractos). NO declarar.

OTROS FRENTES:
- AG2023 (Deuda (ver monto en ESTADO_VIVO.md)): ZARIGÜEYA QUIETA. Declaración activa 2118633856828 (09/09/2024).
  Corrección 2118744089816 = NO VÁLIDA. DIAN (oficio 10/06, Diana M. Rodríguez Castaño)
  invita al Art. 814 = TRAMPA, NO firmar (reconoce deuda, reinicia prescripción).
  DIAN amenaza coactivo + medidas cautelares (embargo).
  Prescripción corre ~09/2029. Vigilar MUISCA 1x/semana (mandamiento de pago).
  Mitigación: no mantener liquidez en cuentas a nombre de Jeiser.
- UGPP 2023: CERRADO FAVORABLE (oficio 12/06, Rad. 20260151005884501).
  ⚠️ PERO bajo vigilancia: fiscalización si detecta ingresos no reportados como independiente.
  Coherencia de ingresos entre DIAN/UGPP ahora CRÍTICA.
- Convalidación bachiller: APROBADA (Res. MinEdu 016066 del 12/06). Matrícula CESDE formalizada.
- REGLA HIERRO: NO firmar 814, NO pagar, NO abonar, NO contactar Cobranzas para la deuda (ver monto en ESTADO_VIVO.md).

═══════════════════════════════════════════════════════════════════
FIN — SKILL TRIBUTARIA COLOMBIA v6.0
═══════════════════════════════════════════════════════════════════

<!--
CHANGELOG

v5.1 → v5.3:
- Mini-check penal en COP con SMMLV 2026 agregado.
- Árbol de decisión: nodo prescripción antes de módulo 814.
- Regla hierro 814 vs Art. 26 reforzada en casos activos.
- Módulo errores comunes agregado (7 errores).

v5.3 → v5.4:
- CE 20635/2017 reubicada: removida de fundamento Art. 26 ET / debido proceso.
  Ahora citada solo en Ataque 5 (subsidiario 755-3) con nota de contexto correcto.
- CE 17558/2011 agregada como jurisprudencia principal para memorial reconsideración
  (debido proceso + carga prueba + no confiscatoriedad).
- Prohibición 20 agregada: NO citar CE 20635/2017 fuera de contexto 755-3.
- Score: 9.8/10.
-->
