# Evidencia%20Taller%20AA1%20%E2%80%94%20Bases%20de%20Datos
> Convertido de PDF | 5/7/2026, 12:08:17 p. m.

PARTE 1 Foro Temático — Evolución de las Bases de Datos

1 ¿Cuál considera usted la etapa más importante en la evolución de las bases de

datos? Justifique su respuesta.

La etapa más importante fue la propuesta del Modelo Relacional por Edgar F. Codd en

1970, junto con la posterior introducción del almacenamiento en disco a finales de los

años 60. Antes de los discos, las cintas magnéticas obligaban a realizar lecturas

secuenciales extremadamente lentas. Codd aprovechó el acceso aleatorio directo del

disco para abstraer los datos en tablas relacionadas mediante claves y lógica

matemática. Esta separación entre la estructura física del hardware y la lógica de la

consulta es lo que hoy nos permite usar SQL y es la base de todo el software moderno.

2 ¿Cuál cree que fue la necesidad de crear sistemas computarizados para administrar

las bases de datos informáticas?

La necesidad principal fue el límite físico y operativo del almacenamiento manual en

papel. A mediados del siglo XX, el crecimiento comercial provocó que buscar

información en carpetas físicas se convirtiera en un cuello de botella. El papel presenta

serias limitaciones: no escala, se deteriora y traspapela con facilidad, no permite que

múltiples usuarios accedan al mismo registro simultáneamente (concurrencia) y genera

una cantidad masiva de datos duplicados e inconsistentes entre distintas áreas de una

misma empresa.

S E R V I C I O N AC I O N A L D E A P R E N D I Z A J E — S E N A

Desarrollo Evidencia: Taller Aplicado y

Foro Temático (AA1)

Bases de Datos: Generalidades y Sistemas de Gestión

## APRENDIZ

Jeiser Abraham Gutiérrez Torres

## FICHA

3549155

## INSTRUCTOR

Rafael Neftalí Lizcano Reyes

## FECHA

30 de junio de 2026



-- 1 of 4 --



3 ¿Cuál es la importancia de los sistemas computarizados en la gestión de las bases

de datos?

Su importancia radica en garantizar la integridad, consistencia y velocidad en el manejo

de la información. Un Sistema de Gestión de Bases de Datos (SGBD) automatiza la

aplicación de llaves y restricciones para evitar registros "huérfanos" (inconsistencias),

asegura el procesamiento seguro mediante transacciones, automatiza la creación de

copias de seguridad (backups) ante fallos y protege la información sensible

restringiendo accesos según roles de usuario.

4 Identifique al menos cinco bases de datos que usted podría encontrar en una

biblioteca y defina cada una de ellas.

1 Base de Datos de Inventario Físico y Estanterías: Clasifica los libros indicando su

ubicación exacta (pasillo, estante, nivel) y la cantidad de copias disponibles para

préstamo o consulta en sala.

2 Base de Datos de Préstamos y Devoluciones: Controla las transacciones de salida

de libros, registrando el ID del usuario, la fecha de entrega y la fecha límite de

retorno del material.

3 Base de Datos de Historial e Intereses del Lector: Almacena los géneros, autores y

títulos que cada usuario consulta con frecuencia, permitiendo al sistema

recomendar lecturas de forma personalizada.

4 Base de Datos de Control de Aforo y Accesos: Registra la entrada y salida de

personas a las instalaciones mediante el escaneo de carnés, midiendo la ocupación

de salas en tiempo real.

5 Base de Datos de Compras y Donaciones: Controla el presupuesto de adquisición

de nuevos títulos, gestiona las órdenes de compra con editoriales y registra a los

donantes externos.



-- 2 of 4 --



## PARTE

2

Taller Aplicado — Conceptos de Base de Datos en una

Empresa

1. NOMBRE DE LA EMPRESA

Manufacturas y Variedades Dominick S.A.S.

2. DESCRIPCIÓN OPERATIVA DE LA EMPRESA

Empresa dedicada a la producción y comercialización de confecciones y prendas de

vestir. Adquiere materias primas (telas, hilos, botones), asigna lotes a

costureros/talleres externos para maquila, recibe las prendas terminadas en bodega,

y despacha pedidos a distribuidores locales y clientes finales.

3. PRODUCTOS Y/O SERVICIOS QUE COMERCIALIZA

Ropa infantil de línea de algodón, servicios de maquila textil y distribución de prendas

terminadas.

4. Necesidades de manejo y almacenamiento de información

• Control del stock de materias primas para evitar desabastecimiento en la línea de

producción.

• Rastrear los lotes asignados a talleres externos (cuál taller tiene qué cantidad de

cortes y su respectiva fecha pactada de entrega).

• Administrar el maestro de clientes con sus respectivas facturas y saldos pendientes

por cobrar.

5. Determinar las aplicaciones de las bases de datos en la empresa

Sistema de Inventario

Un registro relacional donde

la materia prima disminuye

automáticamente al iniciar

una orden de producción.

### Módulo de Facturación y

Cuentas por Cobrar

Vincula las órdenes de

compra de los clientes con

el estado de pago de sus

facturas.

Directorio Relacional de

Proveedores y Talleres

Permite calificar y gestionar

las asignaciones de

producción según la

capacidad de cada taller

externo.



-- 3 of 4 --



6. Mapa mental — Dato, Información, Base de Datos y SGBD

Ej: cantidad de botones "50"

Ej: alerta de stock crítico registrada

Ej: PostgreSQL administra la tabla

El SGBD retroalimenta el ciclo: reporta y alerta al usuario sobre la Información, y

controla directamente la Base de Datos.

Bases de Datos: Generalidades y Sistemas de Gestión — Ficha 3549155 	SENA · 2026

## DATO

### Unidad mínima sin procesar · Ej: el número "50"

## INFORMACIÓN

Datos procesados con contexto útil · Ej: "Stock de botones crítico (50

unidades, mínimo 100)"

## BASE DE DATOS

Almacenamiento organizado · Ej: tabla "Inventario" de Dominick S.A.S.

SGBD (PostgreSQL)

Software gestor · administra consultas, accesos concurrentes y seguridad



-- 4 of 4 --