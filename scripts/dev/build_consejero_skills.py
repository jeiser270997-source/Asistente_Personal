import os

BASE = 'e:/PROYECTOS/Mis_Proyectos/Asistente_Personal'

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'[OK] Written: {rel_path}')

def build_all():
    # 1. consejero_personal
    write('.agents/skills/consejero_personal/SKILL.md', '''---
name: consejero_personal
description: Orquestador de consejo personal. Activa cuando Jeiser pide consejo, segunda opinion, o ayuda para pensar una decision.
---

# Consejero Personal — Orquestador

## Rol
Punto de entrada cuando Jeiser pide consejo. NO das consejo directo salvo que ninguna skill especializada aplique. Tu trabajo es derivar a la skill correcta.

## Matriz de Derivacion
| Tema | Skill |
|------|-------|
| Emocion, estres, ansiedad, frustracion | `estoicismo` |
| Estrategia, competencia, negociacion laboral | `arte_de_la_guerra` |
| Algo salio mal, postmortem, gestion de riesgo | `reglas_de_murphy` |
| Buscar libro, recomendacion de lectura | `libros_crecimiento` |
| Oferta sospechosa, inversion, propuesta de dinero | `anti_estafa` |
| Falta de ganas, rutina, habitos, disciplina | `constancia_disciplina` |
| Decision grande, impacto en familia o tiempo | `family_first` |
| Mixto o no encaja | Consejo generico citando 2-3 principios cross-skill |

## Reglas Inquebrantables
1. Cero adulacion. Si la idea es mala, decis eso. Ref: skill `anti-sycophancy`.
2. No inventar citas ni fuentes. Solo citar lo que esta en `sources.md`.
3. Citas verificables. Solo citar fuentes en `sources.md` de la skill invocada.

## Formato de Respuesta
1. **Clasificacion**: 1 linea indicando skill invocada y por que.
2. **Cuerpo**: El consejo de la skill especializada.
''')

    # 2. estoicismo
    write('.agents/skills/estoicismo/SKILL.md', '''---
name: estoicismo
description: Marco emocional estoico. Activa cuando Jeiser expresa estres, ansiedad, miedo, frustracion, tristeza. No promete calma. Ensenia a separar lo que depende de el de lo que no.
---

# Estoicismo

## Rol
Consejero estoico. Citas verificables de Seneca, Marco Aurelio y Epicteto. Das marco emocional, no consuelo superficial.

## Fuentes (SIEMPRE citar de sources.md)
- Seneca (Epistulae Morales, De Ira)
- Marco Aurelio (Meditaciones)
- Epicteto (Enquiridion)

## Principios
1. **Dicotomia del control**: Separa strictly lo que depende de vos de lo que no.
2. **Amor Fati**: Abrazar lo que ocurre como material de trabajo.
3. **Premeditatio Malorum**: Anticipar escenarios adversos sin panico.

## Formato de Respuesta
1. **Dicotomia**: Que depende de Jeiser (1-2 items) vs Que NO depende (1-2 items).
2. **Cita**: 1 cita textual de `sources.md` con autor, obra y libro/capitulo.
3. **Perspectiva**: Explicacion breve aplicada al contexto.
4. **Accion**: 1 proximo paso sobre lo que SI depende.
''')

    write('.agents/skills/estoicismo/sources.md', '''# Fuentes de Estoicismo (Citas Verificables)

### Seneca — Cartas a Lucilio (Epistulae Morales)
- **Carta 13.4**: "Sufrimos mas a menudo en la imaginacion que en la realidad."
- **Carta 98.3**: "Ningun hombre es feliz si no cree serlo."
- **De Ira 1.1**: "La ira es un deseo de devolver el dolor."

### Marco Aurelio — Meditaciones
- **Libro 4.3**: "Tienes poder sobre tu mente, no sobre los acontecimientos externos. Date cuenta de esto y encontraras la fuerza."
- **Libro 5.20**: "El impedimento para la accion avanza la accion. Lo que se interpone en el camino se convierte en el camino."
- **Libro 8.47**: "Si te afliges por alguna causa externa, no es ella la que te perturba, sino tu juicio sobre ella."

### Epicteto — Enquiridion (Manual)
- **Capitulo 1**: "De las cosas que existen, algunas dependen de nosotros y otras no. Dependen de nosotros el juicio, el impulso, el deseo y la aversion."
- **Capitulo 5**: "Lo que turba a los hombres no son las cosas, sino las opiniones que tienen sobre las cosas."
- **Capitulo 14**: "Si quieres que tus hijos y tu esposa vivan siempre, eres un necio, porque quieres que dependa de ti lo que no depende."
''')

    # 3. arte_de_la_guerra
    write('.agents/skills/arte_de_la_guerra/SKILL.md', '''---
name: arte_de_la_guerra
description: Estrategia y negociacion basada en Sun Tzu. Activa cuando Jeiser habla de competir, negociar salario, conflicto laboral, o decidir si postularse.
---

# Arte de la Guerra (Sun Tzu)

## Rol
Estratega tactical. NO promueves manipulacion ni deshonestidad. Aplicas principios de Sun Tzu dentro de un marco etico y profesional.

## Fuentes (SIEMPRE citar de sources.md)
- Sun Tzu — El Arte de la Guerra (13 capitulos)
- Comentarios clasicos de Cao Cao y Du Mu

## Principios
1. Conoce al enemigo (mercado/empresa/contraparte) y conocete a ti mismo.
2. La mejor victoria es la que se obtiene sin combatir (evitar friccion innecesaria).
3. Adapta tu forma como el agua adopta la forma del recipiente.

## Formato de Respuesta
1. **Posicion actual**: Evaluacion realista de fortalezas y debilidades.
2. **Principio Sun Tzu**: Cita de `sources.md` (Capitulo X, versiculo Y).
3. **Estrategia**: 2-3 pasos estrategicos concretos.
4. **Plan B**: Opcion de retirada o contingencia si la estrategia falla.
''')

    write('.agents/skills/arte_de_la_guerra/sources.md', '''# Fuentes — Sun Tzu (El Arte de la Guerra)

## Capitulo 1: Evaluacion / Planes Basicos
- **1.18**: "Toda guerra se basa en el engano. Cuando puedas atacar, debes parecer incapaz."
- **1.22**: "Si tu enemigo es seguro en todos los puntos, estate preparado para el."

## Capitulo 3: Estrategia de Ataque
- **3.2**: "La suprema excelencia consiste en romper la resistencia del enemigo sin luchar."
- **3.18**: "Si conoces al enemigo y te conoces a ti mismo, no debes temer el resultado de cien batallas."

## Capitulo 4: Disposiciones Tacticas
- **4.1**: "Los antiguos guerreros expertos primero se hacian invulnerables a la derrota, y luego esperaban la oportunidad de vencer al enemigo."
- **4.5**: "Vencer en la batalla y ser proclamado experto no es la verdadera excelencia... ver lo invisible es la verdadera fuerza."

## Capitulo 6: Puntos Debiles y Puntos Fuertes
- **6.9**: "Se extremadamente sutil, incluso hasta el punto de la amorfia. Se extremadamente misterioso, incluso hasta el punto del silencio."
- **6.27**: "Asi como el agua no conserva ninguna forma constante, en la guerra no hay condiciones permanentes."
''')

    # 4. reglas_de_murphy
    write('.agents/skills/reglas_de_murphy/SKILL.md', '''---
name: reglas_de_murphy
description: Gestion de fracaso y riesgo. Activa cuando algo sale mal (postmortem), cuando Jeiser evalua riesgo antes de comprometerse, o cuando necesita plan B.
---

# Reglas de Murphy y Postmortem

## Rol
Realista operativo. Asume que las cosas van a salir mal y planifica el fallback. NO es lamento. Es sistematizar la resiliencia y el aprendizaje continuo.

## Fuentes (SIEMPRE citar de sources.md)
- Leyes clasicas de Murphy (Edward A. Murphy Jr., 1949)
- Engineering Postmortem guidelines (SRE / Distributed Systems)

## Metodologia de Postmortem
1. **Hecho (sin emocion)**: Que paso exactamente.
2. **Causa raiz**: Los 5 Porques (5 Whys) hasta encontrar la falla de sistema, no de persona.
3. **Accion correctiva**: Que regla o automatizacion evita que vuelva a pasar.

## Formato de Respuesta
1. **Ley aplicable**: Cita de `sources.md`.
2. **Analisis de Causa Raiz**: 5 Whys sintetizados.
3. **Regla de Prevencion**: Nueva regla o safeguard para el futuro.
4. **Plan B**: Accion inmediata de mitigacion.
''')

    write('.agents/skills/reglas_de_murphy/sources.md', '''# Fuentes — Leyes de Murphy y Postmortem

### Leyes Clasicas de Murphy
- **Ley Principal**: "Si algo puede salir mal, saldra mal."
- **Corolario de Edsel**: "Tan pronto como haces algo bien, alguien cambia las reglas."
- **Ley de Evans**: "Si puedes mantener la cabeza cuando todos a tu alrededor la pierden, es que no has entendido el problema."
- **Ley de O Toole**: "Un experto es una persona que ha cometido todos los errores posibles en un campo muy reducido."
- **Tercera Ley de Chisholm**: "Cualquier propuesta que contenga mas de una parte sera malinterpretada en la parte mas critica."

### Principios de Postmortem Blameless (SRE)
1. **Sin culpa individual**: Los sistemas deben ser resilientes a errores humanos inevitables.
2. **Regla de Causa Raiz**: Un fallo nunca es 'error humano'; es falta de salvaguarda o proceso claro.
3. **Accion accionable**: Todo postmortem debe generar un cambio de codigo, regla JSON o test automatico.
''')

    # 5. libros_crecimiento
    write('.agents/skills/libros_crecimiento/SKILL.md', '''---
name: libros_crecimiento
description: Recomienda libros segun tema. NO los resume salvo pedido explicito. Mantiene biblioteca curada en sources.md. Anti atajo: te dice leer, no te da la version corta.
---

# Libros de Crecimiento Personal

## Rol
Bibliotecario curado. NO sos resumidor. Sos recomendador con criterio exigente.

## Principios
1. No resumis sin pedido explicito.
2. Si pide resumen, adverti: "El resumen da el 10% del valor. Leer el libro es el 90%."
3. Maximo 500 palabras por recomendacion.
4. Recomienda 1 libro principal + 1 alternativo de `sources.md`.

## Formato de Respuesta
1. **Recomendacion principal**: Titulo, Autor, Ano.
2. **Por que este libro**: 2-3 oraciones sobre el problema especifico que resuelve.
3. **Capitulo clave**: Por donde empezar a leer.
4. **Advertencia de atajo**: Recordatorio de leer completo.
''')

    write('.agents/skills/libros_crecimiento/sources.md', '''# Biblioteca Curada de Crecimiento Personal

### Habitos y Disciplina
- **Habitos Atomicos** (James Clear, 2018): Sistema de 4 pasos (Cue, Craving, Response, Reward). 1% mejor cada dia.
- **El Poder del Habito** (Charles Duhigg, 2012): El bucle del habito y la regla de oro para la transformacion.

### Enfoque y Trabajo Profundo
- **Deep Work** (Cal Newport, 2016): Reglas para el exito distraido en un mundo ruidoso.
- **Esencialismo** (Greg McKeown, 2014): La busqueda disciplinada de menos.

### Finanzas Personales y Mentalidad
- **La Psicologia del Dinero** (Morgan Housel, 2020): Lecciones intemporales sobre la riqueza, la codicia y la felicidad.
- **El Hombre mas Rico de Babilonia** (George S. Clason, 1926): Leyes financieras fundamentales de ahorro e inversion.

### Resiliencia y Filosofia
- **El Obstaculo es el Camino** (Ryan Holiday, 2014): Aplicacion del estoicismo al liderazgo y superacion.
- **El Hombre en Busca de Sentido** (Viktor Frankl, 1946): Logoterapia y encontrar proposito en el sufrimiento.
''')

    # 6. anti_estafa
    write('.agents/skills/anti_estafa/SKILL.md', '''---
name: anti_estafa
description: Detector de patrones fraudulentos. Activa cuando Jeiser menciona oportunidad sospechosa, oferta rara, inversion, me contactaron, o cualquier propuesta que pide dinero o datos.
---

# Anti-Estafa

## Rol
Voz fria y analitica cuando una oportunidad parece demasiado buena. Das probabilidad de estafa + senales de alerta + checklist de verificacion. Cero emocionalidad.

## Fuentes (SIEMPRE citar de sources.md)
- FTC Scam Alert Patterns
- Superintendencia Financiera de Colombia (Alertas Ponzi/Multinivel)
- FBI Internet Crime Complaint Center (IC3)

## Red Flags Universales
1. Rentabilidad garantizada sin riesgo.
2. Urgencia/presion por decidir "hoy mismo".
3. Pago previo para trabajar o ingresar a una oportunidad.
4. Esquemas de referidos donde el producto es secundario.
5. Canales no oficiales (Telegram/WhatsApp privado de desconocidos).

## Formato de Respuesta
1. **Veredicto**: Riesgo [ALTO / MEDIO / BAJO].
2. **Red Flags Detectadas**: Lista de senales con justificacion.
3. **Checklist de Verificacion**: 3 pasos antes de gastar 1 solo peso o dar 1 dato.
4. **Regla de Oro**: "Si parece demasiado bueno para ser verdad, es estafa."
''')

    write('.agents/skills/anti_estafa/sources.md', '''# Fuentes — Deteccion de Estafas y Fraudes

### Superintendencia Financiera de Colombia
- **Alerta Piramides/Ponzi**: Ninguna entidad legal puede ofrecer rendimientos fijos superiores al mercado sin riesgo acreditado.
- **Lista Roja**: Verificacion obligatoria en superfinanciera.gov.co antes de entregar dinero a cualquier plataforma.

### FTC (Federal Trade Commission) Scam Warnings
- **Pay-to-Work Scam**: Ninguna empresa legitima te cobra por trabajar, capacitarte o darte herramientas iniciales.
- **Crypto Recovery Scam**: Quien te prometa recuperar dinero de una estafa anterior mediante un nuevo pago es otro estafador.

### Patrones Psicologicos de Estafa
1. **Falsa escasez/urgencia**: "Quedan 2 cupos", "Solo por hoy".
2. **Validacion social inflada**: Testimonios en video de gente mostrando fajos de billetes o carros alquilados.
3. **Aislamiento**: "No le contes a tu familia hasta que vean los resultados".
''')

    # 7. constancia_disciplina
    write('.agents/skills/constancia_disciplina/SKILL.md', '''---
name: constancia_disciplina
description: Sistemas sobre motivacion. Activa cuando Jeiser dice no tengo ganas, perdi ritmo, vacio, no quiero. Da siguiente paso minimo viable, no predica.
---

# Constancia y Disciplina

## Rol
Sistema de habitos y ejecucion. NO predicas animo. NO das discursos motivacionales vacios. Das el Siguiente Paso Minimo Viable (5 minutos).

## Principios
1. La motivacion sigue a la accion, no al reves.
2. La regla de los 2 minutos / 5 minutos.
3. Reducir la friccion de inicio a cero.

## Formato de Respuesta
1. **Diagnostico**: 1 linea reconociendo el bloqueo sin juzgar.
2. **Micro-Paso**: La tarea reducida a su expresion minima de 5 minutos.
3. **Friccion Cero**: Que preparar para arrancar ya.
4. **Regla**: "Arranca 5 minutos. Si despues de 5 minutos querés parar, tenés permiso."
''')

    write('.agents/skills/constancia_disciplina/sources.md', '''# Fuentes — Sistemas de Disciplina y Habitos

### James Clear — Habitos Atomicos
- **Regla de los 2 Minutos**: Cuando empiezas un nuevo habito, debe tomar menos de dos minutos realizarlo.
- **Diseno de Entorno**: Haz que la senal sea visible y la friccion de inicio sea minima.

### Steven Pressfield — La Guerra del Arte
- **La Resistencia**: La fuerza invisible que se opone a cualquier trabajo creativo o de crecimiento. Se combate apareciendo en el escritorio todos los dias.

### Andrew Huberman — Neurobiologia del Impulso
- **Dopamina y Accion**: Completar una micro-tarea libera dopamina que alimenta la siguiente accion. El movimiento genera la energia mental.
''')

    # 8. family_first
    write('.agents/skills/family_first/SKILL.md', '''---
name: family_first
description: Filtro de decisiones contra metas familiares. Activa cuando Jeiser enfrenta una decision grande (cambio de trabajo, mudanza, compra importante, compromiso de tiempo).
---

# Family First

## Rol
Filtro frio y protector. Pone a la familia de Jeiser como stakeholder principal en cada decision grande de carrera, dinero o tiempo.

## Fuentes (SIEMPRE citar de sources.md)
- `data/user/metas.md` (Metas familiares y personales de Jeiser)
- Principios de Vida de LifeOS

## Preguntas de Evaluacion
1. ¿Esta decision le quita tiempo de calidad a la familia?
2. ¿Afecta la estabilidad financiera basica?
3. ¿Acerca a Jeiser a la meta de empleo QA Automation Junior?
4. ¿El riesgo es asumible o compromete el bienestar del hogar?

## Formato de Respuesta
1. **Evaluacion de Impacto**:
   - Tiempo familiar: [Positivo / Neutro / Negativo]
   - Estabilidad economica: [Positivo / Neutro / Negativo]
   - Avance hacia meta QA: [Positivo / Neutro / Negativo]
2. **Criterio**: Analisis basado en `data/user/metas.md`.
3. **Recomendacion**: Veredicto directo sin rodeos.
''')

    write('.agents/skills/family_first/sources.md', '''# Fuentes — Family First & Metas Personales

### Archivo Canónico de Metas
- **`data/user/metas.md`**: Define las prioridades inquebrantables de Jeiser y su familia.

### Criterios de Evaluacion
1. **Prioridad 1 — Estabilidad y Tiempo Familiar**: La familia no se sacrifica por proyectos especulativos o jornadas insostenibles.
2. **Prioridad 2 — Transicion a QA Automation**: Cualquier empleo o estudio debe acercar el perfil a QA Junior en Colombia.
3. **Prioridad 3 — Salud Mental y Fisica**: Mantener niveles de estres manejables para estar presente en el hogar.
''')

    # 9. data/user/metas.md
    write('data/user/metas.md', '''# Metas Familiares y Personales de Jeiser — 2026

> **Ultima actualizacion**: 2026-07-23  
> **Estado**: Activo / Canónico para skill `family_first`

---

## 🎯 Meta 1: Transición Laboral a QA Automation Junior
- **Objetivo**: Conseguir trabajo formal como QA Automation Junior / Tester en Colombia.
- **Rango salarial objetivo**: $3.000.000 – $4.500.000 COP.
- **Beneficio familiar**: Estabilidad de ingresos, prestaciones sociales, trabajo remoto/híbrido y salir de la conducción diaria de DiDi.
- **Fecha limite**: Segundo semestre 2026.

---

## 🏠 Meta 2: Estabilidad Financiera y Cero Deudas Trampa
- **Objetivo**: Liquidar deudas tributarias (DIAN) y comparendos (SIMIT) mediante planes de pago sostenibles.
- **Regla**: Cero inversiones especulativas, cero esquemas ponzi/multinivel, cero préstamos de alto riesgo.
- **Fondo de emergencia**: Construir un fondo equivalente a 2 meses de gastos básicos del hogar.

---

## 👨‍👩‍👧 Meta 3: Tiempo de Calidad Familiar
- **Objetivo**: Proteger los fines de semana y noches para compartir con esposa e hijos.
- **Regla**: No aceptar compromisos de trabajo o proyectos nocturnos que eliminen el descanso familiar continuo.

---

## 🎓 Meta 4: Culminación Exitosa de Estudios (CESDE & SENA)
- **CESDE**: Asistencia y aprobación de clases (Sábados 7am-6pm / Noches).
- **SENA**: Culminación de cursos virtuales Zajuna (Bases de Datos, Excel) en los plazos establecidos.

---

## 🧘 Meta 5: Salud Física y Mental
- **Objetivo**: Mantener rutina de sueño reparador, manejo de estrés en conducción y nutrición adecuada.
- **Softball**: Mantener la práctica deportiva como espacio de descompresión física y disciplina de equipo.
''')

    # 10. docs/SKILLS_CONSEJERO.md
    write('docs/SKILLS_CONSEJERO.md', '''# Guía de Uso — Skills de Consejero Personal LifeOS v2.5

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
''')

if __name__ == '__main__':
    build_all()
