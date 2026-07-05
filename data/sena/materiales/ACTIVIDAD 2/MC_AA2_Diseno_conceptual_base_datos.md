# MC_AA2_Diseno_conceptual_base_datos
> Convertido de PDF | 5/7/2026, 12:08:16 p. m.

### TEMA 6. DISEÑO CONCEPTUAL DE BASES DE DATOS.

MODELO ENTIDAD – RELACIÓN.

1. Introducción

2. Metodología de diseño de bases de datos

3. Modelos de datos

4. El modelo entidad – relación

5. Metodología de diseño conceptual



-- 1 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	2

1. Introducción

¿Principal causa de fracaso en el diseño de sistemas de información?

La poca confianza en las metodologías de diseño de bases de datos.

Consecuencias: 	¾Se subestiman el tiempo o los recursos necesarios.

¾Las bases de datos son inadecuadas o ineficientes.

¾La documentación es limitada.

¾El mantenimiento es difícil.



-- 2 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	3

2. Metodología de diseño de bases de datos

Especificación de requisitos

## DISEÑO CONCEPTUAL

Esquema conceptual

Esquema lógico

Esquema físico

## DISEÑO LÓGICO

## DISEÑO FÍSICO

Normalización



-- 3 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	4

Esquema conceptual 	Descripción de alto nivel del contenido de

información de la base de datos, independiente del

SGBD que se vaya a utilizar.

Modelo conceptual 	Lenguaje que se utiliza para describir esquemas

conceptuales.

Propósito 	Obtener un esquema completo que lo exprese todo.

Especificación

de requisitos

Esquema

conceptual

Diseño conceptual



-- 4 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	5

Esquema lógico 	Descripción de la estructura de la base de datos según

el modelo del SGBD que se vaya a utilizar.

Modelo lógico 	Lenguaje que se utiliza para describir esquemas

lógicos; hay varios modelos lógicos: de red, relacional,

orientado a objetos, ...

Propósito 	Obtener una representación que use de la manera más

eficiente los recursos disponibles en el modelo lógico

para estructurar datos y modelar restricciones.

El diseño lógico depende del modelo de BD que soporta el SGBD.

Esquema

conceptual

Esquema

lógico

Diseño lógico



-- 5 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	6

Esquema físico 	Descripción de la implantación de una BD en la

memoria secundaria: estructuras de almacena-

miento y métodos usados para tener un acceso

efectivo a los datos. El diseño físico se adapta al

SGBD específico que se va a utilizar.

Se expresa haciendo uso del lenguaje de definición de datos del SGBD.

Por ejemplo, en SQL las sentencias que se utilizan son las siguientes:

## CREATE DATABASE

## CREATE TABLE 	CREATE SCHEMA

## CREATE VIEW 	CREATE SNAPSHOT

## CREATE INDEX 	CREATE CLUSTER

Esquema

lógico

Esquema

físico

Diseño físico



-- 6 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	7

Dependencia de cada una de las etapas del diseño,

en el tipo de SGBD y en el SGBD específico:

Tipo de SGBD 	SGBD específico

Diseño conceptual 	NO 	NO

Diseño lógico 	SÍ 	NO

Diseño físico 	SÍ 	SÍ



-- 7 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	8

3. Modelos de datos

Esquema: Descripción de la estructura de los datos de interés.

Un esquema conceptual se representa mediante un modelo conceptual de datos.

Cualidades que debe poseer un modelo conceptual:

¾ 	Expresividad.

¾ 	Simplicidad.

¾ 	Minimalidad.

¾ 	Formalidad.

Además, hay que añadir aserciones que complementen el esquema.



-- 8 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	9

4. El modelo entidad – relación

Es el modelo conceptual más utilizado para el diseño conceptual de bases de datos.

Fue introducido por Peter Chen en 1976.

Elementos

básicos

Otros

elementos

Entidades

Relaciones entre entidades (interrelaciones)

Atributos

Jerarquías de generalización

Atributos compuestos

Identificadores

(modelo original)

(añadidos para

mejorar la

expresividad)



-- 9 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	10

Entidad

¾ 	Tipo de objeto 	sobre el que se recoge información: cosa, persona, concepto abstracto o

suceso (coches, casas, 	empleados, 	clientes, 	empresas, 	oficios, 	diseños 	de 	productos,

conciertos, excursiones, etc.).

¾ 	Las entidades se representan gráficamente mediante rectángulos y su nombre aparece en el

interior.

¾ 	Un nombre de entidad sólo puede aparecer una vez en el esquema.

ASIGNATURA es una entidad;

Inglés, Cálculo, Algorítmica son ocurrencias de esta entidad.

CIUDAD es una entidad;

Castellón, Barcelona, Toledo son ocurrencias de esta entidad.

## ASIGNATURA

## CIUDAD



-- 10 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	11

Relación (interrelación)

¾ 	Correspondencia o asociación entre dos o más entidades.

¾ 	Las relaciones se representan gráficamente mediante 	rombos y su nombre aparece en el

interior.

¾ 	La cardinalidad con la que una entidad participa en una relación especifica el número mínimo

y el número máximo de correspondencias en las que puede tomar parte cada ocurrencia de

dicha entidad.

## EMPLEADO 	CIUDAD

l ugar

residencia

l ugar

nacimiento

(1,n)

(1,1)

(0,n)

(0,n)

EMPLEADO 	director

es_dirigido_por

dirige_a 	(0,n)

(1,1)

participación total

u obligatoria

participación parcial

u opcional



-- 11 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	12

Atributo

¾ Característica de interés sobre una entidad o sobre una relación.

¾ La cardinalidad de un atributo indica el número mínimo y el número máximo de valores que

puede tomar para cada ocurrencia de la entidad o relación a la que pertenece. El valor por

omisión es (1,1).

## EMPLEADO 	CIUDAD

residencia

nacimiento

(1,n)

(0,1)

(0,n)

(0,n)

nombre

altitud

num_habitantes

nombre

dni

título

fecha_inicio

fecha_nacimiento

(0,n)

(0,1)

(0,1)



-- 12 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	13

Jerarquía de generalización

¾ La entidad E es una generalización de las entidades E1, E2, ... En, si las ocurrencias de

éstas son también ocurrencias de E. Todas las propiedades de la entidad genérica son

heredadas por las subentidades.

¾ Cada jerarquía es total o parcial, y exclusiva o superpuesta.

¾ Un 	subconjunto 	es un caso particular de generalización con una sola entidad como

subentidad. Un subconjunto siempre es una jerarquía parcial y exclusiva.

## EMPLEADO

## DIRECTIVO 	ADMINISTRATIVO 	SERVICIOS	FIJO 	TEMPORAL

## PROGRAMADOR 	COMERCIAL 	PUBLICIDAD	DIRECTOR

## TECNICO

## DIRECTOR

## ADMINISTRATIVO

(t,e) 	(p,e)

(p,s)	(t,s)

## FUNCIONARIO



-- 13 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	14

Atributo compuesto

¾ Grupo de atributos que tienen afinidad en cuanto a su significado o en cuanto a su uso.

¾ Un atributo compuesto se representa gráficamente mediante un óvalo.

## EMPLEADO

nombre

dni

título

fecha_nacimiento

ciudad_residencia

fecha_inicio

lugar_residencia(0,n) 	(1,n)

ciudad_nacimiento

lugar_nacimiento

(0,1)



-- 14 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	15

Identificador

¾ Un identificador de una entidad es un atributo o conjunto de atributos que determina de modo único

cada ocurrencia de esa entidad. Todo identificador debe cumplir :

(1) no pueden existir dos ocurrencias de la entidad con el mismo valor del identificador,

(2) si se omite cualquier atributo del identificador, la condición (1) deja de cumplirse.

¾ Toda entidad tiene al menos un identificador y puede tener varios identificadores alternativos.

## EMPLEADO

dni 	ciudad

nombre

fecha_nacim

## EMPLEADO

## DEPARTAMENTO

trabaja_en

(1,1)

(1,n)

num_emp

num_depto

## S 	SP 	P

S# 	P#

cant

(0,n) 	(1,1) 	(1,1) 	(0,n)



-- 15 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	16

5. Metodología de diseño conceptual

Para cada área funcional de la empresa se construye un esquema

conceptual local siguiendo estos pasos:

(1) 	Identificar las entidades.

(2) 	Identificar las relaciones.

(3) 	Identificar los atributos y asociarlos a entidades y relaciones.

(4) 	Determinar los dominios de los atributos.

(5) 	Determinar los identificadores.

(6) 	Determinar las jerarquías de generalización (si las hay).

(7) 	Dibujar el diagrama entidad – relación.

(8) 	Revisar el esquema conceptual local con el usuario.



-- 16 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	17

Ejemplo

momento ∈ {mañana, tarde, noche, indiferente}

cuánto ∈ {nada, normal, mucho}

## AMIGO

## CERVEZA

nombre

(0,n)

BAR

marca 	nombre 	dirección

nombre 	teléfono

gusta 	frecuenta

sirve (1,n)

(1,n) 	(1,n)

(0,n) 	(0,n)

momento

cuánto

(0,n)



-- 17 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	18

Ejercicio 1

## ASUNTO

## CLIENTE

nombre

## PROCURADOR

nombre 	dirección

número_expediente

estado

tiene 	lleva

(1,1) 	(0,n)

(1,n) 	(0,n)

dirección

período

fecha_incio

fecha_fin

(0,1)

dni 	dni



-- 18 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	19

Ejercicio 2

Hay un ciclo ¿alguna relación es redundante?

## ANIMAL

ZOO

nombre

## ESPECIE

posee 	pertenece

(1,1) 	(1,1)

(1,n) 	(1,n)

tamaño

país

ciudad

presupuesto

nombre_científico

peligro

familia

nombre_vulgar

número_identificación

continente

país

sexo

año_nacimiento

alberga

(1,n) 	(1,n)



-- 19 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	20

Ejercicio 3

## SOCIO

## PATRÓN

nombre

## BARCO

posee

(1,1)

(1,n)

dirección

matrícula

cuota

amarre

nombre

salida

(0,n) 	(0,n)

destino

hora

fecha

## PERSONA

dni

(t,s)



-- 20 of 21 --



### Tema 6. Diseño conceptual de bases de datos 	21

De cada AMIGO sabemos el nombre y su teléfono.

De cada BAR sabemos el nombre y la dirección.

De cada CERVEZA sabemos el nombre y la marca.

Los AMIGOS frecuentan uno o varios bares. Puede que les guste ir a cada bar en momentos distintos del día

(mañana, tarde o noche), o puede que les sea indiferente.

Cada AMIGO ha probado una o varias cervezas y sabe cuánto le 	gustan: nada, normal o mucho.

Una misma CERVEZA puede gustar a varios AMIGOS y puede servirse en varios BARES distintos.

De las CERVEZAS que tenemos, algunas no las ha probado nadie.

También puede ocurrir que haya CERVEZAS que no se sirvan en ninguno de los BARES que nos interesan.

Cada BAR sirve una o varias cervezas.

Entre los BARES que nos interesan, puede que haya algunos que no frecuenten nuestros amigos, y otros que

sean frecuentados por varios amigos.



-- 21 of 21 --