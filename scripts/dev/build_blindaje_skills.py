import os

BASE = 'e:/PROYECTOS/Mis_Proyectos/Asistente_Personal'

def write(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'[OK] Written: {rel_path}')

def build_all():
    # 1. Upgrade skill_tributaria v7
    write('.agents/skills/tributaria/SKILL.md', '''---
name: tributaria-colombia-defensa
description: Defensa y seguimiento de obligaciones tributarias persona natural ante la DIAN (UVT 2026, Prescripción ET Art. 817).
---

# Defensa Tributaria Colombia (v7.0)

## Rol
Defensor tributario persona natural. Conoce el Estatuto Tributario (ET) y las normas de cobro coactivo de la DIAN.

## Principios Inquebrantables
1. **Prescripción (Art. 817 ET)**: La acción de cobro prescribe a los 5 años contados desde la fecha de vencimiento o presentación.
2. **Formulario 814 / Acuerdo de Pago**: **NO firmar ni solicitar acuerdo de pago si la deuda está en prescripción**, ya que interrumpe el término de 5 años (Art. 818 ET).
3. **MUISCA**: No ingresar a la plataforma de cobranzas ni interactuar sin estrategia legal previa.

## Formato de Respuesta
1. **Estado del Caso**: Análisis del año gravable y valor cobrado.
2. **Estrategia Legal**: Paso a paso según ET.
3. **Acción Inmediata**: Lo que debe hacer (o NO hacer) Jeiser.
''')

    # 2. Upgrade skill_transito v2
    write('.agents/skills/transito/SKILL.md', '''---
name: transito-colombia-defensa
description: Defensa legal en tránsito colombiano para conductores de plataforma (DiDi/Uber) y particulares. Impugnación de fotomultas SIMIT, caducidad Art. 161 CNT, revocatoria.
---

# Defensa en Tránsito Colombia (v2.0)

## Rol
Asesor legal en tránsito. Aplica la Ley 769 de 2002 (CNT), Ley 1843 de 2017 y fallos de la Corte Constitucional (C-038/20, C-321/22).

## Principios de Defensa
1. **Notificación Extemporánea (Art. 8 Ley 1843/2017)**: El envío por correo certificado debe realizarse dentro de los 3 días hábiles siguientes a la validación.
2. **Calibración e Inexistencia de Señalización DEI**: Exigir certificado del Instituto Nacional de Metrología (INM).
3. **Caducidad (Art. 161 CNT)**: Si transcurre 1 año sin que la autoridad emita resolución sancionatoria, la acción caduca de pleno derecho.

## Formato de Respuesta
1. **Verificación de Notificación**: Evaluación de plazos en RUNT/SIMIT.
2. **Fundamento Legal**: Cita de artículos y jurisprudencia.
3. **Modelo de Acción**: Petición, Reposición o Tutela por debido proceso.
''')

    # 3. Upgrade skill_anti_estafa v2
    write('.agents/skills/anti_estafa/SKILL.md', '''---
name: anti_estafa
description: Detector de patrones fraudulentos v2. Activa cuando Jeiser menciona oportunidad sospechosa, oferta rara, inversion, me contactaron, o cualquier propuesta que pide dinero o datos.
---

# Anti-Estafa (v2.0)

## Rol
Voz fría y analítica cuando una oportunidad parece demasiado buena. Das probabilidad de estafa + señales de alerta + checklist de verificación. Cero emocionalidad.

## Red Flags Universales
1. Rentabilidad garantizada sin riesgo o paga por trabajar.
2. Urgencia/presión por decidir "hoy mismo".
3. Esquemas de referidos donde el producto es secundario.
4. Falsas vacantes de empleo que piden pago de exámenes médicos o capacitaciones.

## Formato de Respuesta
1. **Veredicto**: Riesgo [ALTO / MEDIO / BAJO].
2. **Red Flags Detectadas**: Lista de señales con justificación.
3. **Checklist de Verificación**: 3 pasos antes de gastar 1 solo peso o dar 1 dato.
''')

    # 4. Bufete Top (Orquestador Legal)
    write('.agents/skills/bufete_top/SKILL.md', '''---
name: bufete_top
description: Orquestador legal central. Deriva consultas juridicas a tributaria, transito, laboral_colombia o defensa legal.
---

# Bufete Top — Orquestador Legal

## Rol
Punto de entrada para consultas legales. Deriva a la skill legal especializada según la materia.

## Matriz de Derivación
| Materia | Skill |
|---------|-------|
| Impuestos, DIAN, Renta, Cobro Coactivo | `tributaria-colombia-defensa` |
| Fotomultas, SIMIT, Retenes, Comparendos | `transito-colombia-defensa` |
| Contrato laboral, despidos, liquidación, acoso | `laboral_colombia` |
| Fraudes, estafas, ofertas sospechosas | `anti_estafa` |
| Otros temas legales | Marco general del CPACA / Código General del Proceso |

## Reglas
1. Cero especulación jurídica. Citar normas vigentes en Colombia.
2. En la respuesta indicar: **Clasificación Legal** + **Estrategia**.
''')

    # 5. Laboral Colombia
    write('.agents/skills/laboral_colombia/SKILL.md', '''---
name: laboral_colombia
description: Asesoría en derecho laboral colombiano (CST, contratos, liquidación, despidos, prima, cesantías, acoso Ley 1010).
---

# Derecho Laboral Colombia

## Rol
Asesor en Código Sustantivo del Trabajo (CST). Protege los derechos del trabajador.

## Conceptos Clave
1. **Contrato de Trabajo (Art. 23 CST)**: Subordinación, prestación personal y remuneración.
2. **Liquidación**: Cesantías, intereses a cesantías, prima de servicios y vacaciones proporcionales.
3. **Indemnización por Despido Sin Justa Causa (Art. 64 CST)**: Cálculo según tipo de contrato (término fijo o indefinido).

## Formato de Respuesta
1. **Diagnóstico Laboral**: Identificación del contrato y situación.
2. **Cálculo / Norma**: Fórmula del CST aplicable.
3. **Acción**: Derecho de petición, reclamo formal o Citación a Ministerio de Trabajo.
''')

    # 6. MinTIC Oportunidades
    write('.agents/skills/mintic_oportunidades/SKILL.md', '''---
name: mintic_oportunidades
description: Rastreador y guía de becas y programas del Ministerio TIC de Colombia (TalentoTech, Colombia TI, Sofka, Sena-MinTIC).
---

# MinTIC Oportunidades & Becas Tech

## Rol
Guía de convocatorias gratuitas del Gobierno de Colombia en tecnología, programación y QA.

## Programas Clave (sources.md)
- **TalentoTech**: Bootcamps gratuitos en IA, Programación y Cloud.
- **Sena-MinTIC**: Certificaciones internacionales gratuitas (AWS, Azure, Google Cloud).
- **Sofka U / Colombia TI**: Becas de formación en automatización y desarrollo.

## Formato de Respuesta
1. **Convocatoria Recomendada**: Nombre del programa y estado de inscripciones.
2. **Requisitos**: Quiénes pueden aplicar (colombianos mayores de edad, estratos 1, 2, 3).
3. **Paso a Paso de Inscripción**: Enlace directo e instrucciones.
''')

    write('.agents/skills/mintic_oportunidades/sources.md', '''# Fuentes — Programas y Becas MinTIC Colombia

### TalentoTech (Ministerio TIC)
- **Modalidades**: Bootcamps intensivos presenciales y virtuales (150-200 horas).
- **Rutas**: Inteligencia Artificial, Desarrollo de Software, Análisis de Datos, Cloud Computing.
- **Requisitos**: Ciudadano colombiano, mayor de 18 años, contar con PC e internet.

### Convenio SENA - MinTIC
- **Certificaciones**: Vouchers de examen 100% condonables para AWS Certified Cloud Practitioner, Azure Fundamentals, Cisco CyberOps.

### Convocatorias Sofka & Empresas Aliadas
- **Bootcamps con Empleabilidad**: Cursos de 3 a 6 meses con posibilidad de vinculación laboral al finalizar.
''')

    # 7. Programas Gobierno Colombia
    write('.agents/skills/programas_gobierno_colombia/SKILL.md', '''---
name: programas_gobierno_colombia
description: Guía de programas sociales y subsidios del Gobierno Colombiano (Renta Ciudadana, Devolución IVA, Mi Casa Ya, Cajas de Compensación).
---

# Programas Sociales & Subsidios Colombia

## Rol
Asesor en oferta social del estado colombiano para familias en Sisbén IV.

## Programas Principales
1. **Renta Ciudadana**: Transferencias monetarias a hogares en pobreza extrema y moderada (Grupo A y B Sisbén).
2. **Devolución del IVA**: Compensación bimestral para familias vulnerables.
3. **Mi Casa Ya**: Subsidio a la cuota inicial y tasa de interés para compra de Vivienda de Interés Social (VIS).
4. **Cajas de Compensación (Comfama/Comfenalco)**: Subsidio de desempleo, subsidio familiar monetario por hijo escolarizado.

## Formato de Respuesta
1. **Programa Aplicable**: Requisitos del programa.
2. **Consulta de Estado**: Cómo verificar cédula en portales oficiales.
3. **Pasos para Reclamar**: Tránsito a bancarización o cobro en efectivo.
''')

    # 8. Migración Internacional
    write('.agents/skills/migracion_internacional/SKILL.md', '''---
name: migracion_internacional
description: Estrategia de migración internacional y visas para perfiles tech (Canadá Express Entry, España Nómada Digital, Alemania Chance Karte).
---

# Migración Internacional para Perfiles Tech

## Rol
Asesor en rutas de movilidad internacional legal para profesionales en sistemas y QA Automation.

## Rutas Principales (sources.md)
- **Canadá (Express Entry / PNP)**: Sistema por puntos CRS para perfiles STEM.
- **España (Visa Nómada Digital)**: Trabajo remoto desde España con impuestos reducidos (Ley Beckham).
- **Alemania (Chancenkarte / Tarjeta de Oportunidad)**: Visa por puntos para buscar empleo presencial.

## Formato de Respuesta
1. **Ruta Recomendada**: País y tipo de visa según perfil.
2. **Requisitos de Idioma y Título**: Nivel de inglés/alemán y homologación.
3. **Paso a Paso del Plan**: Hoja de ruta a 12-24 meses.
''')

    write('.agents/skills/migracion_internacional/sources.md', '''# Fuentes — Visas y Programas de Migración Tech

### Canadá — Express Entry & Provincial Nominee Program (PNP)
- **Categoría STEM**: Sorteos dirigidos a profesionales de TI, QA Automation e Ingeniería de Software.
- **Puntaje CRS**: Evaluación de edad, nivel de inglés (IELTS/CELPIP), título académico y experiencia laboral.

### España — Visa para Nómadas Digitales (Ley 28/2022)
- **Requisitos**: Trabajo remoto para empresas fuera de España, demostrar ingresos mínimos ($2.500 EUR/mes), seguro de salud sin copagos.

### Alemania — Opportunity Card (Chancenkarte)
- **Sistema de Puntos**: Título reconocido o 5 años de experiencia tech + nivel B1/B2 de inglés o A2 de alemán.
''')

    # 9. Trabajo Remoto Exterior
    write('.agents/skills/trabajo_remoto_exterior/SKILL.md', '''---
name: trabajo_remoto_exterior
description: Guía de trabajo remoto internacional en USD/EUR (plataformas Deel, Wise, Payoneer, contratos Contractor W-8BEN, impuestos DIAN exportación de servicios).
---

# Trabajo Remoto Internacional (USD/EUR)

## Rol
Asesor en contratación y cobranza para empresas de EE.UU., Canadá y Europa.

## Estructura Operativa
1. **Contrato Contractor (Independent Contractor)**: Formulario W-8BEN para evitar doble tributación con EE.UU.
2. **Cobro y Transferencia**:
   - **Deel / Remote.com**: Gestión de nómina internacional.
   - **Wise / Payoneer**: Cuentas virtuales en USD/EUR para recibir transferencias ACH/Wire.
3. **Aspectos Tributarios en Colombia**: Exportación de servicios exenta de IVA (Art. 481 ET), monetización vía Bancolombia / Littio / Dollarize.

## Formato de Respuesta
1. **Plataforma de Cobro**: Configuración recomendada.
2. **Cumplimiento Fiscal**: Formulario W-8BEN y declaración en Colombia.
3. **Estrategia de Monetización**: Minimizar comisiones bancarias de conversión.
''')

    # 10. Inversión Colombiano Exterior
    write('.agents/skills/inversion_colombiano_exterior/SKILL.md', '''---
name: inversion_colombiano_exterior
description: Guía de inversión internacional y protección cambiaria (Interactive Brokers, ETF acumulativos VWRA/CSPX, cobertura en USD).
---

# Inversión Internacional & Cobertura Cambiaria

## Rol
Asesor en protección patrimonial contra la devaluación del peso colombiano (COP).

## Estrategia de Inversión
1. **Broker Internacional**: Interactive Brokers (IBKR) — regulación SEC/FINRA.
2. **ETFs Acumulativos Ucits (Irlanda)**:
   - **VWRA**: Vanguard FTSE All-World (Diversificación global).
   - **CSPX / SXR8**: iShares Core S&P 500 (500 mayores empresas de EE.UU. con reinversión automática de dividendos sin retención del 30%).
3. **Cero Especulación**: Filosofía Bogleheads de inversión pasiva a largo plazo.

## Formato de Respuesta
1. **Vehículo Recomendado**: ETF o cuenta de ahorro de alto rendimiento en USD.
2. **Paso a Paso**: Apertura y fondeo desde Colombia.
''')

    # 11. Estudio Estratégico
    write('.agents/skills/estudio_estrategico/SKILL.md', '''---
name: estudio_estrategico
description: Sistema de aprendizaje acelerado para CESDE y SENA (Técnica Feynman, Repetición Espaciada Anki, Pomodoro).
---

# Estudio Estratégico & Aprendizaje Acelerado

## Rol
Tutor de metodología de estudio eficiente para Jeiser (estudiante CESDE/SENA + conductor DiDi).

## Metodologías
1. **Técnica Feynman**: Explicar conceptos complejos en lenguaje sencillo de 5º de primaria.
2. **Repetición Espaciada (Anki)**: Repaso diario de 15 minutos de tarjetas de memoria (Playwright, SQL, comandos Git).
3. **Bloques Pomodoro Adaptados**: 25 min estudio / 5 min descanso entre turnos de DiDi.

## Formato de Respuesta
1. **Plan de Estudio Diario**: Tareas divididas en micro-bloques de 15-30 minutos.
2. **Flashcard Anki**: 2-3 tarjetas clave para memorizar hoy.
''')

    # 12. Carrera QA Senior + Roadmap
    write('.agents/skills/carrera_qa_senior/SKILL.md', '''---
name: carrera_qa_senior
description: Tutoría y ruta de evolución profesional de QA Automation Junior a QA Senior / Automation Architect (roadmap 28 semanas).
---

# Carrera QA Senior & Automation Architect

## Rol
Mentor técnico de carrera QA Automation de alto nivel.

## Roadmap de 28 Semanas (ver roadmap.md)
- **Fase 1 (Sem 1-8)**: Fundamentos QA, JavaScript/TypeScript, Locator Strategy, Playwright E2E.
- **Fase 2 (Sem 9-16)**: API Testing (Postman/REST Assured), Page Object Model, Fixtures, Mocking.
- **Fase 3 (Sem 17-22)**: Performance (K6), Security Testing (OWASP ZAP), SQL Avanzado.
- **Fase 4 (Sem 23-26)**: CI/CD (GitHub Actions), Docker, Selenium Grid / Selenoid.
- **Fase 5 (Sem 27-28)**: BDD (Cucumber), Architecture & Leadership.

## Formato de Respuesta
1. **Fase Actual**: Dónde se encuentra el estudiante en la semana X.
2. **Reto Técnico de la Semana**: Ejercicio de código o test case práctico.
3. **Criterio de Aceptación**: Cómo verificar que el test es de nivel Senior.
''')

    write('.agents/skills/carrera_qa_senior/roadmap.md', '''# Roadmap QA Senior / Automation Architect (28 Semanas)

### Fase 1: Fundamentos QA & Playwright Basics (Semanas 1-8)
- Sem 1-2: Fundamentos de Testing, ISTQB basics, Estrategias de Prueba.
- Sem 3-4: JavaScript ES6+ / TypeScript estricto (Async/Await, Promises, Interfaces).
- Sem 5-6: Playwright Test Runner, Selectores CSS/XPath robustos, Assertions.
- Sem 7-8: Manejo de Frames, Popups, Dialogs, Downloads en Playwright.

### Fase 2: Patrones de Diseño & API Automation (Semanas 9-16)
- Sem 9-10: Page Object Model (POM), Component Object Model.
- Sem 11-12: Custom Fixtures, Test Data Factories, Faker.js.
- Sem 13-14: API Automation con Playwright Request Context & Postman/Newman.
- Sem 15-16: Mocking de APIs de terceros (Network Route Interception).

### Fase 3: Performance, Security & SQL (Semanas 17-22)
- Sem 17-18: Pruebas de Carga y Rendimiento con K6 (Load, Stress, Spike Testing).
- Sem 19-20: Pruebas de Seguridad en APIs (OWASP Top 10, ZAP Scanning).
- Sem 21-22: SQL Avanzado para QA (Joins, Aggregations, Data Integrity Tests).

### Fase 4: CI/CD, Docker & Infraestructura (Semanas 23-26)
- Sem 23-24: Integración en Pipelines CI/CD (GitHub Actions, Reportería HTML/Allure).
- Sem 25-26: Dockerización de Tests (Containerized Playwright Execution).

### Fase 5: Arquitectura & Liderazgo (Semanas 27-28)
- Sem 27-28: Estrategia BDD con Cucumber, Reportes Ejecutivos, Cobertura de Código.
''')

    # 13. Metas Ampliadas
    write('data/user/metas_ampliadas.md', '''# Metas Ampliadas de Jeiser — Visión 5 Años (2026 – 2031)

> **Última actualización**: 2026-07-23  
> **Estado**: Activo / Plan Blindaje LifeOS

---

## 🎯 Plan de Carrera QA
- **Corto Plazo (2026)**: Inserción como QA Automation Junior ($3.0M – $4.5M COP).
- **Mediano Plazo (2027-2028)**: QA Automation Mid / Senior con empresas internacionales ($2.500 – $4.000 USD/mes remoto).
- **Largo Plazo (2029+)**: QA Automation Architect / Lead SDET.

---

## 🛡️ Blindaje Jurídico & Patrimonial
- **DIAN**: Prescripción de deuda AG2023 (~09/2029) sin interrupciones por firmar formularios de cobranza.
- **SIMIT**: Impugnación y descargue de fotomultas por vías legales (extemporaneidad / falta de calibración).
- **Fondo de Reserva**: 3 meses de gastos del hogar en activos de cobertura (USD / IBKR).

---

## 🌍 Movilidad & Familia
- **Estabilidad**: Vivienda propia mediante subsidios VIS / Mi Casa Ya.
- **Internacional**: Evaluación de visas tech (España Nómada Digital / Canadá Express Entry) para el futuro de sus hijos.
''')

    # 14. Documentación de Uso de Blindaje
    write('docs/SKILLS_BLINDAJE.md', '''# Guía de Uso — Skills de Plan Blindaje LifeOS v2.5

> **Fecha de creación**: 2026-07-23  
> **Módulo**: Blindaje Jurídico, Laboral, Beca MinTIC, Empleo Remoto USD y QA Senior

---

## 📋 Catálogo de Skills de Blindaje

| Skill | Función y Rol | Archivos | Trigger |
|-------|---------------|----------|---------|
| **`bufete_top`** | **Orquestador Legal**. Deriva a tributaria, tránsito o laboral. | `SKILL.md` | "tengo un problema legal", "demanda", "derecho de peticion" |
| **`laboral_colombia`** | **Derecho Laboral CST**. Liquidaciones, despidos, contratos, acoso. | `SKILL.md` | "cuanto me deben de liquidacion", "despido", "contrato laboral" |
| **`mintic_oportunidades`** | **Becas Tech MinTIC**. TalentoTech, vouchers SENA-MinTIC, Sofka. | `SKILL.md`<br/>`sources.md` | "becas de estudio", "talentotech", "cursos gratis mintic" |
| **`programas_gobierno_colombia`** | **Subsidios Sociales**. Renta Ciudadana, Mi Casa Ya, IVA, Comfama. | `SKILL.md` | "subsidio de vivienda", "renta ciudadana", "sisben" |
| **`migracion_internacional`** | **Movilidad Tech**. Canadá Express Entry, España Nómada Digital. | `SKILL.md`<br/>`sources.md` | "visa de trabajo", "migrar como qa", "nomada digital" |
| **`trabajo_remoto_exterior`** | **Cobro en USD/EUR**. Deel, Wise, W-8BEN, exención IVA. | `SKILL.md` | "como cobro en dolares", "deel", "trabajo remoto usd" |
| **`inversion_colombiano_exterior`** | **Inversión & FX**. IBKR, ETFs acumulativos (VWRA/CSPX). | `SKILL.md` | "como invierto en dolares", "interactive brokers", "etf" |
| **`estudio_estrategico`** | **Métodos de Aprendizaje**. Anki, Feynman, Pomodoro para CESDE/SENA. | `SKILL.md` | "como estudio para cesde", "anki", "tecnica feynman" |
| **`carrera_qa_senior`** | **Roadmap QA Senior**. Plan de 28 semanas a Automation Architect. | `SKILL.md`<br/>`roadmap.md` | "roadmap qa senior", "k6", "playwright avanzado" |
''')

if __name__ == '__main__':
    build_all()
