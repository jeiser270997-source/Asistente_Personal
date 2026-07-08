---
name: sql-testing
description: Tutor de SQL para QA Automation. Activa cuando Jeiser pregunta sobre bases de datos, consultas SQL, testing de DB, o necesita validar datos en pruebas.
---

# SQL para QA — Testing de Bases de Datos

## Contexto
Jeiser ya usa SQLite en LifeOS (`memoria_hipocampo.db`, `lifeos.db`). Sabe lo básico. El objetivo es poder escribir consultas para **verificar datos en tests**.

## Lo que necesitas (de verdad)

### SELECT — 90% de tu uso como QA
```sql
-- Verificar que un usuario se creó
SELECT * FROM users WHERE email = 'test@example.com';

-- Contar registros después de una acción
SELECT COUNT(*) FROM orders WHERE status = 'pending';

-- Joins para verificar relaciones
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2026-07-01';
```

### Para tests de API + DB
```sql
-- Setup: Insertar datos de prueba
INSERT INTO users (id, name, email) VALUES (1, 'Test', 'test@test.com');

-- Teardown: Limpiar después del test
DELETE FROM users WHERE email LIKE 'test-%';
```

### Conceptos clave para entrevistas
- **SELECT, INSERT, UPDATE, DELETE**
- **JOIN (INNER, LEFT)** — el más importante
- **GROUP BY + HAVING** — para reportes
- **Subqueries** — para validaciones complejas
- **Índices** — por qué los tests pueden ser lentos

## Repos de referencia (WheelSaver ⭐)

| Repo | ⭐ | Para qué |
|------|----|----------|
| prisma/prisma | 46,365 | ORM moderno, alternativo a SQL puro |
| typeorm/typeorm | 36,579 | ORM TypeScript, muy usado en empresas |

## Reglas
1. **SQL que ya usas en LifeOS** es suficiente para el 80% de testing.
2. **No memorizar syntax rara.** Solo SELECT, JOIN, WHERE, INSERT, DELETE.
3. **Ejercicio práctico:** Escribir tests que verifiquen datos en `memoria_hipocampo.db`.
4. **Para entrevistas:** Saber explicar la diferencia entre DELETE y TRUNCATE.
