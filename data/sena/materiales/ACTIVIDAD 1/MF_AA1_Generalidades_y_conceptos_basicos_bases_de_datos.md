# MF_AA1_Generalidades_y_conceptos_basicos_bases_de_datos
> Convertido de PDF | 5/7/2026, 12:08:16 p. m.

Generalidades y conceptos

básicos de bases de datos



-- 1 of 19 --



Tabla de contenido

### Introducción .................................................................................................................. 5

Mapa conceptual ........................................................................................................... 6

1. Generalidades ........................................................................................................ 7

1.1 Origen de la base de datos ..................................................................................... 7

1.1.1 Máquina perforadora .......................................................................................... 7

1.1.2 Cintas magnéticas .............................................................................................. 8

1.1.3 Uso de disco ....................................................................................................... 8

1.1.4 Modelo relacional de datos ................................................................................. 9

1.1.5 SQL (Lenguaje de Consulta Estructurada) ....................................................... 10

1.1.6 Oracle ............................................................................................................... 10

1.1.7 Base de datos orientada a objetos ................................................................... 11

2. Conceptos básicos .............................................................................................. 12

2.1 Dato ...................................................................................................................... 12

2.2 Información ........................................................................................................... 12

2.3 Base de datos ....................................................................................................... 12

3. Componentes de las bases de datos ................................................................. 13

4. Sistemas de Gestión de Base de Datos (SGBD) ............................................... 14

5. Funciones del gestor de base de datos ............................................................. 15



-- 2 of 19 --



Referentes bibliográficos ........................................................................................... 16

Créditos........................................................................................................................ 17



-- 3 of 19 --



Lista de figuras

Figura 1. Mapa conceptual .............................................................................................. 6

Figura 2. Herman Hollerith .............................................................................................. 7

Figura 3. Cintas magnéticas ............................................................................................ 8

Figura 4. Uso de disco .................................................................................................... 8

Figura 5. Edgar Frank Codd ............................................................................................ 9

Figura 6. Lenguaje de Consulta Estructurada (SQL) .................................................... 10

Figura 7. Oracle ............................................................................................................ 10

Figura 8. Microsoft......................................................................................................... 11



-- 4 of 19 --



5

Introducción

En este material se suministrarán, a los aprendices, los conceptos de bases de datos

con los cuales podrá identificar y clasificar una base de datos y los Sistemas de

Gestores de las Bases de Datos (SGBD) dentro de una organización, brindando la

capacidad de desarrollar alguna de ellas.



-- 5 of 19 --



6

Mapa conceptual

En el mapa conceptual que se comparte a continuación, se evidencia la interrelación

temática del contenido que se plantea en este material de formación:

Figura 1. Mapa conceptual

Fuente: SENA (2019)



-- 6 of 19 --



7

1. Generalidades

1.1 Origen de la base de datos

Las grandes cantidades de información almacenadas por las empresas de forma

manual, llevó a la necesidad de crear sistemas automatizados que permitieran

administrar y consultar la información de forma rápida y eficaz.

La evolución de las bases de datos arranca con:

1.1.1 Máquina perforadora

Figura 2. Herman Hollerith

Fuente: Biografías y Vidas (s.f.)

Creada por Herman Hollerith en 1884, se utilizó para el censo de los Estados Unidos

en 1890, consistía en ordenar y enumerar las tarjetas perforadas que contenían los

datos de personas censadas.



-- 7 of 19 --



8

1.1.2 Cintas magnéticas

Figura 3. Cintas magnéticas

Fuente: Pixabay (2014)

Data de la década de 1950, el proceso de guardar información se realizaba a través de

bandas plásticas magnetizadas que permitían grabar videos, audio y datos, su principal

uso fue para automatizar la información de nómina de las industrias del momento. Su

desventaja fue que solo se podía leer de manera secuencial.

1.1.3 Uso de disco

Figura 4. Uso de disco

Fuente: Unsplash (s.f.)



-- 8 of 19 --



9

En 1960 las empresas adquieren y utilizan computadores para almacenar, modificar y

actualizar la información. La utilización de los discos fue un avance muy importante

debido a que se podía consultar de forma secuencial, directa y rápida. Con estos se da

el inicio de las bases de datos de redes y bases de datos jerárquicas.

1.1.4 Modelo relacional de datos

Figura 5. Edgar Frank Codd

Fuente: Blog Historia de la Informática (2011)

En 1970 el científico informático Edgar Frank Codd, conocido por sus aportes a la

teoría de bases de datos relaciónales, escribe el artículo “Un modelo relacional de

datos para grandes bancos de datos compartidos" en el cual explica las reglas para la

evaluación de administradores de sistemas de datos relacionales. Esto llevó al

nacimiento de este modelo de bases de datos.

El modelo relacional de datos propone organizar y recuperar la información, de base de

datos de grandes tamaños, de forma rápida.



-- 9 of 19 --



10

1.1.5 SQL (Lenguaje de Consulta Estructurada)

Figura 6. Lenguaje de Consulta Estructurada (SQL)

Fuente: Blog Historia de la Informática (2011)

Creada por IBM en 1974, también se conoce como lenguaje de consulta, es un

software para el manejo de bases de datos relacional con el uso de sistemas de tablas

con el cual se puede crear, insertar, modificar, eliminar y consultar información de la

base de datos.

1.1.6 Oracle

Figura 7. Oracle

Fuente: Blog Historia de la Informática (2011)

A partir del modelo relacional de datos, Lawrence J. Ellison, en 1977, desarrolló

el Relacional Software Sistema conocido actualmente como Oracle, un sistema de

gestión de bases de datos relacional con el mismo nombre que dicha compañía.



-- 10 of 19 --



11

Oracle, es el sistema más completo que existe para administrar base de datos de

servidores empresariales.

1.1.7 Base de datos orientada a objetos

Figura 8. Microsoft

Fuente: Pixabay (2013)

En 1990, Microsoft crea las herramientas Access y Excel para el gestionar de bases de

datos complejas.

En la actualidad, las compañías que dominan el comercio de las bases de datos son:

IBM, Oracle y Microsoft; en la red de internet se destaca Google por el gran volumen de

información que contienen sus bases de datos, las consultas son de respuesta

inmediata.



-- 11 of 19 --



12

2. Conceptos básicos

2.1 Dato

### Unidad mínima de información, un dato por sí solo no tiene importancia hasta el

momento que son procesados y transformados por aplicativos informáticos para arrojar

un resultado.

2.2 Información

Es el procesamiento y transformación de un conjunto de datos relacionados mediante

la utilización de software.

2.3 Base de datos

Una base de datos se puede definir como la información organizada, almacenada y

estructurada, a través de un computador, que permite tener acceso a la información de

forma actualizada y precisa. Las bases de datos deben cumplir tres principios

fundamentales:

a) Definir datos: al crear una base de datos se debe definir cada uno de los datos

según su importancia, esto con el fin de evitar resultados erróneos al momento de

acceder a la información.

b) Compartir datos: por estar los datos debidamente relacionados entre sí, estos se

pueden compartir entre los usuarios.

c) Modelo de datos: hace referencia a la organización y forma como se relacionan

los datos, se compone por entidades, atributos y relaciones.



-- 12 of 19 --



13

3. Componentes de las bases de datos

Administrador de la base de datos: es la persona encargada de administrar la base

de datos y cuenta con permisos específicos para dicha función.

Índices y estructura de datos relacionados: es la clasificación de los datos en

principal y secundarios, además de la forma como se encuentran relacionados.

Metadato de aplicación: son los aplicativos ejecutables de la base de datos.

Metadatos: son los datos que se encuentran almacenados en la estructura de la base

de datos.

Procedimiento de almacenamiento: son aplicativos que permiten administrar la base

de datos.

Trigger (disparadores): son bloques de código PL/SQL asociados a una tabla y que

se ejecutan automáticamente como reacción a una operación DML específica

(insert, update o delete) sobre dicha tabla.



-- 13 of 19 --



14

4. Sistemas de Gestión de Base de Datos (SGBD)

Son los aplicativos que permiten gestionar, almacenar, modificar y extraer la

información de una base de datos.

Tipo de sistemas de gestor de bases de datos, según la base de datos que se

gestione

SGBD corporativos: gestiona bases de datos de gran información de empresas que,

para el almacenamiento, modificación y actualización requiere de un servidor de gran

capacidad.

SGBD ofimáticos: gestiona bases de datos muy pequeñas que se pueden manipular

en tablas de Microsoft Access, por ejemplo, lista de proveedores de una tienda de

barrio.



-- 14 of 19 --



15

5. Funciones del gestor de base de datos

El gestor de base de datos es un profesional de la tecnología informática con la

capacidad de administrar, almacenar, modificar y actualizar bases de datos relacional,

dentro de una empresa. Tiene como funciones:

 Velar por la seguridad: el gestor de base de datos es el encargado de establecer

las políticas de seguridad en cuanto se refiere al acceso de la información de la

base de datos.

 Velar por la integridad: el gestor de la base de datos establecerá políticas de

seguridad que protejan la integridad de la información, evitando así la pérdida total

o parcial de la misma.

 Recuperación de datos: establecer políticas de seguridad, referente a realizar

copias de seguridad de manera periódica (back up), que permitan la recuperación

de la información en un caso fortuito de daño de la base de datos.

 Desarrollador de aplicaciones: cuenta con la capacidad de orientar y asesorar a

los desarrolladores de aplicaciones al momento de gestionar nuevas tareas en la

base de datos.



-- 15 of 19 --



16

Referentes bibliográficos

Alcalde, A. (2017, octubre 7). PL/SQL. Disparadores o Triggers. [Web log post].

Recuperado de https://elbauldelprogramador.com/plsql-disparadores-o-triggers/

Biografías y Vidas. (s.f.). Herman Hollerith. Recuperado de

https://www.biografiasyvidas.com/biografia/h/hollerith.htm

Conocelahistoria.com. (s.f.). Historia de la base de datos: evolución, gestores y más

[Web log post]. Recuperado de http://conocelahistoria.com/c-tecnologia/historia-

de-la-base-de-datos/

Historia de la informática. (2011, Enero 4a). Edgar Frank Codd [Web log post].

Recuperado de https://histinf.blogs.upv.es/files/2011/01/edgar_frank_codd.jpg

Historia de la informática. (2011, Enero 4b). Historia de las Bases de Datos [Web log

post]. Recuperado de https://histinf.blogs.upv.es/2011/01/04/historia-de-las-

bases-de-datos/

Historia de la informática. (2011, Enero 4c). Lenguaje de consulta estructurada (SQL)

[Web log post]. Recuperado de

https://histinf.blogs.upv.es/files/2011/01/imagesCAHW1TUV.jpg

Historia de la informática. (2011, Enero 4d). Oracle [Web log post]. Recuperado de

https://histinf.blogs.upv.es/files/2011/01/logo_oracle.jpg

Martínez, P. on Unsplash. (s.f.). Uso de disco. Recuperado

https://unsplash.com/photos/GxDrxO4_P6U



-- 16 of 19 --



17

Pixabay. (2013). Microsoft. Recuperado de https://pixabay.com/es/vectors/microsoft-

ms-logo-negocios-windows-80658/

Pixabay. (2014). Cintas magnéticas. Recuperado de

https://pixabay.com/es/photos/cinta-magn%C3%A9tica-reel-to-reel-vintage-

401189/

Vélez, L. (2010). Gestión de Bases de Datos. Recuperado de

https://buildmedia.readthedocs.org/media/pdf/gestionbasesdatos/latest/gestionba

sesdatos.pdf



-- 17 of 19 --



18



-- 18 of 19 --



19



-- 19 of 19 --