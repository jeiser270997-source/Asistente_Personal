# MF_AA4_Aplicacion_y_diseno_de_bases_de_datos_relacional
> Convertido de PDF | 5/7/2026, 12:08:17 p. m.

Aplicación y diseño de

bases de datos relacional



-- 1 of 18 --



Tabla de contenido

### Introducción .................................................................................................................. 5

Mapa conceptual ........................................................................................................... 6

1. Pasos para desarrollar y diseñar una base de datos relacional......................... 7

2. Ejercicio planteado ................................................................................................. 8

3. Solución al ejercicio planteado ............................................................................. 9

3.1 Definir el requerimiento de la base de datos ............................................................. 9

3.2 Identificación de entidades con los atributos y tipo de datos correspondientes ...... 10

3.3 Definir para cada entidad una llave primaria (PK) con la cual se establecerá las

relaciones entre entidad ................................................................................................ 11

3.4 Aplicación de la normalización de la base de datos ................................................ 12

Primera regla de normalización (1FN)........................................................................... 12

Segunda regla de normalización (2FN) ......................................................................... 13

Tercera regla de normalización (3FN) ........................................................................... 14

3.5 Definir para cada entidad una llave foránea (FK) .................................................... 15

3.6 Definir la cardinalidad que existe entre entidades para generar el diagrama Entidad-

Relación (E-R) ............................................................................................................... 15

Referentes bibliográficos ........................................................................................... 17

Créditos........................................................................................................................ 18



-- 2 of 18 --



Lista de figuras

Figura 1. Mapa conceptual .............................................................................................. 6

Figura 2. Diagrama Entidad-Relación (E-R) .................................................................. 16



-- 3 of 18 --



Lista de tablas

Tabla 1. Artículos .......................................................................................................... 10

Tabla 2. Cliente ............................................................................................................. 10

Tabla 3. Proveedor ........................................................................................................ 10

Tabla 4. Ciudad ............................................................................................................. 11

Tabla 5. Sucursales....................................................................................................... 11

Tabla 6. Vendedores ..................................................................................................... 11

Tabla 7. Artículos (PK) .................................................................................................. 12

Tabla 8. Cliente (PK) ..................................................................................................... 12

Tabla 9. Proveedor (PK)................................................................................................ 12

Tabla 10. Ciudad (PK) ................................................................................................... 12

Tabla 11. Sucursales (PK) ............................................................................................ 12

Tabla 12. Vendedores (PK) ........................................................................................... 12

Tabla 13. Primera forma de normalización (1FN) ......................................................... 13

Tabla 14. Segunda forma de normalización .................................................................. 14

Tabla 15. Tercera forma de normalización .................................................................... 14

Tabla 16. Llaves foráneas ............................................................................................. 15



-- 4 of 18 --



5

Introducción

En la actualidad la información de una empresa es el motor de todo negocio, siendo

esta la clave de transformación de ellos. En cada actividad diaria los registros sufren

modificaciones las cuales deben ser bien administradas garantizando el buen

funcionamiento de las empresas. Para lograr este objetivo, se han diseñado las bases

de datos que son un conjunto de tablas organizadas y relacionadas entre sí, que

garantizan la integridad de la información.

La base de datos y su sistema de gestión van de la mano, por lo tanto, debe estar muy

bien diseñada con el fin de que la información, que es única para cada empresa, se

mantenga protegida al momento que esta vaya incrementando su volumen.



-- 5 of 18 --



6

Mapa conceptual

En el mapa conceptual que se comparte a continuación, se evidencia la interrelación

temática del contenido que se plantea en este material de formación:

Figura 1. Mapa conceptual

Fuente: SENA (2019)



-- 6 of 18 --



7

1. Pasos para desarrollar y diseñar una base de datos relacional

1. Definir el requerimiento para el cual se va a crear la base de datos.

2. Identificación de entidades con los atributos y tipo de datos correspondientes.

3. Definir, para cada entidad, una llave primaria (PK).

4. Aplicación de la normalización de la base de datos.

5. Definir, para cada entidad, una llave foránea (FK).

6. Definir la cardinalidad que existe entre entidades para generar el diagrama Entidad-

Relación (E-R).



-- 7 of 18 --



8

2. Ejercicio planteado

Se desea crear una base de datos para llevar el control de inventario de un almacén de

artículos de aseo, los datos que hay que tener en cuenta son:

 Los artículos de venta, para lo cual hay que identificarlos con: nombre, código,

precio, cantidad y código del proveedor.

 Los clientes se deben identificar con: nombre, apellidos, identificación, dirección y

número celular.

 Los proveedores se identifican con: nombre, ciudad, código y código de artículo que

distribuye.

 Vendedores: nombre, apellido y código.

Los clientes pueden comprar varios artículos, a su vez, los artículos pueden ser

comprados por varios clientes, los proveedores pueden suministrar un solo artículo, los

vendedores pueden vender muchos artículos a muchos clientes, el almacén LQ S.A.

tiene algunas sucursales en algunas ciudades del país.



-- 8 of 18 --



9

3. Solución al ejercicio planteado

3.1 Definir el requerimiento de la base de datos

El almacén de artículos de aseo LQ S.A. requiere diseñar una base de datos para

controlar el stock de inventario de bodega con el objetivo de conocer los productos que

tienen mayor y menor movimiento en el almacén.

Además, la empresa LQ S.A. requiere llevar un registro completo de sus clientes,

inventario de sus productos en cada sucursal y un listado de los proveedores.

Para el anterior caso planteado se tiene el siguiente análisis:

 La empresa LQ. S.A. cuenta con sucursales en cinco ciudades del país, las cuales

se identifican con: código, ciudad, dirección, vendedores y clientes, entre otros.

 Los clientes serán identificados con: código, nombre, apellido, ciudad, número de

cédula, entre otros. Los clientes pueden adquirir varios productos en diferentes

sucursales.

 Los productos se identifican con código, nombre, proveedor, entre otros. Son de

varios proveedores.

 Los proveedores distribuyen varios productos a todas las sucursales.

 Los vendedores se identifican por: nombre, código y ubicación de la sucursal.



-- 9 of 18 --



10

3.2 Identificación de entidades con los atributos y tipo de datos correspondientes

Tabla 1. Artículos

Atributos Tipo de dato Longitud

Nom_artículo String 20

Cod_artículo Numérico 10

Stock_artículo Numérico 4

Precio unitario compra Moneda 4

Precio unitario venta Moneda 4

Cod_cliente Numérico 10

Cod_proveedor Numérico 4

Fuente: SENA (2019)

Tabla 2. Cliente

Atributos Tipo de dato Longitud

Nom_cliente String 20

Apellido_cliente String 20

Ced_cliente Numérico 10

Dirección_cliente String 20

Móvil_cliente1 Numérico 10

Cod_sucursal Numérico 10

Cod_cliente Numérico 10

Nom_artículo String 20

Cod_artículo Numérico 10

Cod_ciudad Numérico 4

Fuente: SENA (2019)

Tabla 3. Proveedor

Atributos Tipo de dato Longitud

Nom_proveedor Carácter 20

Cod_proveedor Numérico 10

Ciudad_proveedor String 10

Cod_artículo Numérico 4

Precio unitario compra Moneda 4

Nom_artículo String 20

Fuente: SENA (2019)



-- 10 of 18 --



11

Tabla 4. Ciudad

Atributos Tipo de dato Longitud

Nom_ciudad String 20

Cod_ciudad Numérico 20

Cod_vendedor Numérico 20

Cod_proveedor Numérico 10

Cod_cliente Numérico 10

Fuente: SENA (2019)

Tabla 5. Sucursales

Atributos Tipo de dato Longitud

Nom_sucursal Carácter 20

Cod_sucursal Numérico 10

Ciudad_sucursal String 10

Cod_cliente Numérico 4

Cod_proveedor Numérico 4

Fuente: SENA (2019)

Tabla 6. Vendedores

Atributos Tipo de dato Longitud

Nom_vendedor Carácter 20

Cod_vendedor Numérico 10

Cod_sucursal Numérico 10

Ciudad_sucursal String 10

Cod_cliente Numérico 4

Cod_proveedor Numérico 4

Fuente: SENA (2019)

3.3 Definir para cada entidad una llave primaria (PK) con la cual se establecerá

las relaciones entre entidad

Se debe tener en cuenta que una llave primaria (PK) es el atributo único en cada tabla.



-- 11 of 18 --



12

Tabla 10. Ciudad (PK)

Fuente: SENA (2019)

Atributos

Nom_ciudad

Cod_ciudad (PK)

Cod_vendedor

Cod_proveedor

Cod_cliente

Tabla 11. Sucursales (PK)

Fuente: SENA (2019)

Atributos

Nom_sucursal

Cod_sucursal (PK)

Ciudad_sucursal

Cod_cliente

Cod_proveedor

Tabla 12. Vendedores (PK)

Fuente: SENA (2019)

Atributos

Nom_vendedor

Cod_vendedor (PK)

Cod_sucursal

Ciudad_sucursal

Cod_cliente (NA)

Cod_proveedor

3.4 Aplicación de la normalización de la base de datos

Para la aplicación de la normalización de la base de datos se tendrán en cuenta las tres

reglas básicas de normalización de forma ordenada:

 Primera regla de normalización (1FN)

En esta regla se identificarán, en cada tabla, los atributos no atómicos (NA).

Atributos

Nom_artículo

Cod_artículo (PK)

Stock_artículo

Precio unitario compra

Precio unitario venta

Cod_cliente

cod_proveedor

Tabla 7. Artículos (PK)

Fuente: SENA (2019)

Atributos

Nom_cliente

Apellido_cliente

Ced_cliente

Dirección_cliente

Móvil_cliente1

Cod_sucursal

Cod_cliente (PK)

Nom_artículo

Cod_artículo

Cod_ciudad

Tabla 8. Cliente (PK)

Fuente: SENA (2019)

Atributos

Nom_proveedor

Cod_proveedor (PK)

Ciudad_proveedor

Cod_artículo

Precio unitario compra

Nom_artículo

Tabla 9. Proveedor (PK)

Fuente: SENA (2019)



-- 12 of 18 --



13

Tabla 13. Primera forma de normalización (1FN)

Artículos

Nom_artículo

Cod_artículo (PK)

Stock_artículo (NA)

Precio unitario compra

Precio unitario venta

Cod_cliente (NA)

cod_proveedor (NA)

Cliente

Nom_cliente

Apellido_cliente

Ced_cliente

Dirección_cliente

Móvil_cliente1

Cod_sucursal

Cod_cliente (PK)

Nom_artículo (NA)

Cod_artículo (NA)

Cod_ciudad

Proveedor

Nom_proveedor

Cod_proveedor (PK)

Ciudad_proveedor

Cod_artículo (NA)

Precio unitario compra

Nom_artículo (NA)

Ciudad

Nom_ciudad

Cod_ciudad (PK)

Cod_vendedor

Cod_proveedor

Cod_cliente

Sucursal

Nom_sucursal

Cod_sucursal (PK)

Ciudad_sucursal

Cod_cliente (NA)

Cod_proveedor (NA)

Vendedores

Nom_vendedor

Cod_vendedor (PK)

Cod_sucursal

Ciudad_sucursal

Cod_cliente (NA)

Cod_proveedor

Fuente de tablas: SENA (2019)

 Segunda regla de normalización (2FN)

Una vez identificados los atributos repetidos, se procede a generar tablas nuevas,

teniendo en cuenta los valores atómicos para evitar la redundancia de datos.



-- 13 of 18 --



14

Tabla 14. Segunda forma de normalización

Artículos

Nom_artículo

Cod_artículo (PK)

Precio unitario compra

Precio unitario venta

Ciudad

Nom_ciudad

Cod_ciudad (PK)

Cod_sucursal

Cliente

Nom_cliente

Apellido_cliente

Ced_cliente

Dirección_cliente

Móvil_cliente1

Cod_sucursal

Cod_cliente (PK)

Cod_ciudad

Sucursal

Nom_sucursal

Cod_sucursal (PK)

Ciudad_sucursal

Proveedor

Nom_proveedor

Cod_proveedor (PK)

Ciudad_proveedor

Precio unitario compra

Vendedores

Nom_vendedor

Cod_vendedor (PK)

Cod_sucursal

Ciudad_sucursal

Cod_proveedor

Fuente de tablas: SENA (2019)

 Tercera regla de normalización (3FN)

Determinar las dependencias que existen en los atributos con las claves no primarias

y crear nuevas tablas de acuerdo a las dependencias encontradas.

Tabla 15. Tercera forma de normalización

Fuente de tablas: SENA (2019)

Artículos

Nom_artículo

Cod_artículo (PK)

Precio unitario compra

Precio unitario venta

Ciudad

Nom_ciudad

Cod_ciudad (PK)

Cod_sucursal

Cliente

Nom_cliente

Apellido_cliente

Ced_cliente

Dirección_cliente

Móvil_cliente1

Cod_sucursal

Cod_cliente (PK)

Cod_ciudad

Sucursal

Nom_sucursal

Cod_sucursal (PK)

Ciudad_sucursal

Proveedor

Nom_proveedor

Cod_proveedor (PK)

Ciudad_proveedor

Precio unitario compra

Vendedores

Nom_vendedor

Cod_vendedor (PK)

Cod_sucursal

Ciudad_sucursal

Cod_proveedor



-- 14 of 18 --



15

Las tablas ya están en la tercera forma de normalización (3FN), no hubo más

modificaciones ni creación de nuevas tablas, ya que las entidades están identificadas

de manera única a través de la llave primaria (PK), esto garantiza que no habrá

registros repetidos y la base de datos tendrá un fácil manejo para actualizar, modificar y

consultar.

3.5 Definir para cada entidad una llave foránea (FK)

Tabla 16. Llaves foráneas

Artículos

Nom_artículo

Cod_artículo (PK)

Precio unitario

compra

Precio unitario venta

Ciudad

Nom_ciudad

Cod_ciudad (PK)

Cod_sucursal

Cliente

Nom_cliente

Apellido_cliente

Ced_cliente

Dirección_cliente

Móvil_cliente1

Cod_sucursal (FK)

Cod_cliente (PK)

Cod_ciudad (FK)

Sucursal

Nom_sucursal

Cod_sucursal (PK)

Ciudad_sucursal (FK)

Proveedor

Nom_proveedor

Cod_proveedor (PK)

Ciudad_proveedor (FK)

Precio unitario compra

Vendedores

Nom_vendedor

Cod_vendedor (PK)

Cod_sucursal (FK)

Ciudad_sucursal (FK)

Cod_proveedor (FK)

Fuente de tablas: SENA (2019)

3.6 Definir la cardinalidad que existe entre entidades para generar el diagrama

Entidad-Relación (E-R)

Los artículos: son distribuidos por un proveedor en cada sucursal de cada ciudad y

son adquiridos por varios clientes en cada sucursal.

Los clientes: adquieren varios artículos en diferentes sucursales.

Las sucursales: hay una en cada ciudad.



-- 15 of 18 --



16

Los vendedores: tienen muchos clientes y muchos artículos en una sucursal.

Los proveedores: distribuyen varios artículos.

Figura 2. Diagrama Entidad-Relación (E-R)

Fuente: SENA (2019)

Una vez generado el diagrama Entidad-Relación se puede garantizar el buen manejo

de la información de la empresa, es hora de seleccionar el mejor sistema de gestión

donde se aplicará el diseño que se construyó, en el cual se podrá esbozar el ambiente

interactivo que facilitará la interacción del usuario con la información.



-- 16 of 18 --



17

Referentes bibliográficos

Chamorro, A. y Escobar, C. (2018). Introducción al modelamiento de bases de datos y

SQL básico para una biblioteca. Recuperado de

http://eprints.rclis.org/12681/1/Serie_N%C2%BA_42,_Noviembre_2008-2.pdf



-- 17 of 18 --



18

Créditos

Gestor del proceso de recursos digitales

Juan Bautista Londoño Pineda

Responsable de producción y creación

Jhoana Andrea Vásquez Gómez

Evaluador de calidad instruccional

Erika Alejandra Beltrán Cuesta

Desarrollador de contenidos

Olga Elena Meneses Camino

E-pedagogo instruccional

Juan Carlos Ramírez Molina

Evaluador de contenidos

Claudia Marcela Peña Galeano

Desarrollador Full-Stack

Daniel Enciso Arias

Francisco José Lizcano Reyes

Germán Alberto Rodríguez Liévano

Leyson Fabián Castaño Pérez

Luis Felipe Zapata Castaño

Luis Gabriel Urueta Álvarez

Creativo de recursos didácticos

Carlos Andrés Díaz Botero

Cristian Andrés Osorio Caiza

Jessica Orozco Salazar

Maira Camila Olmos Hernández

Melissa Ochoa Alvarado

Centro Agroindustrial - Regional Quindío

Centro Agropecuario - Regional Risaralda

2019



-- 18 of 18 --