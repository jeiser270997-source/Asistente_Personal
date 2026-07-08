---
name: docker-qa
description: Tutor de Docker para QA Automation. Activa cuando Jeiser pregunta sobre contenedores, Docker, docker-compose, o testing en entornos aislados.
---

# Docker para QA — Contenedores para Tests

## Contexto
No necesitas ser DevOps. Necesitas saber lo suficiente para:
1. Correr tests en un contenedor (CI/CD)
2. Levantar servicios temporales (DBs, APIs) para tests
3. Entrevistas técnicas (preguntan conceptos básicos)

## Lo que realmente necesitas saber (70% de lo que preguntan)

### Mandatorio (para cualquier oferta QA)
```dockerfile
# Dockerfile para tests
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
CMD ["npm", "test"]
```

```yaml
# docker-compose.yml para tests con DB
version: '3'
services:
  test-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_PASSWORD: test
  test-runner:
    build: .
    depends_on:
      - test-db
    environment:
      DATABASE_URL: postgres://postgres:test@test-db:5432/testdb
```

### Conceptos clave (para entrevistas)
- **Imagen vs Contenedor** (clase vs instancia)
- **Port mapping** (`-p 3000:3000`)
- **Volumes** (persistir datos)
- **Multi-stage builds** (imágenes más ligeras)
- **Healthchecks** (esperar a que un servicio esté listo)

## Repos de referencia (WheelSaver ⭐)

No hay repos específicos de Docker testing en el top, pero estos son los estándar:
- docs.docker.com (la mejor referencia)
- github.com/wsargent/docker-cheat-sheet (el resumen más popular)

## Reglas
1. **Solo lo práctico.** No explicar teoría de contenedores, solo cómo usarlos para tests.
2. **Simular en local primero.** Docker Desktop o Rancher Desktop.
3. **Conectar con LifeOS:** El asistente podría correr dentro de un contenedor.
4. **Ejercicio:** Crear un Dockerfile que corra los tests de Playwright.
