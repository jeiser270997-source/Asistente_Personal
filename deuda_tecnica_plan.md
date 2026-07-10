# Plan de Saneamiento de Deuda Técnica — LifeOS
> Documentado el 10 de julio de 2026 | Estado: Pendiente de ejecución para el futuro

Este documento registra los riesgos estructurales identificados en la arquitectura de LifeOS y detalla un plan de implementación por fases para resolverlos cuando se decida escalar el sistema.

---

## 🔍 1. Diagnóstico de Deuda Técnica y Riesgos

### 🔴 Riesgo 1: Volatilidad del Caché de GitHub Actions (Riesgo Alto)
*   **Diagnóstico:** El uso de `actions/cache` para persistir la base de datos `lifeos.db` entre ejecuciones de GitHub Actions de corta duración (cada 5 minutos) es un riesgo crítico. El caché de GitHub es volátil, tiene límites de almacenamiento y se purga automáticamente tras inactividad del repositorio.
*   **Impacto:** Si el caché se pierde o falla al restaurarse, se borrará todo el historial del masterledger, aplicaciones y casos de uso.
*   **Mitigación:** Configurar replicación real e independiente en la nube.

### 🟡 Riesgo 2: Volatilidad de la Cola en Memoria (Event Bus) (Riesgo Medio)
*   **Diagnóstico:** La cola de reintentos y la Dead Letter Queue (DLQ) en `event_bus.js` residen estrictamente en la memoria RAM del proceso de Node.js.
*   **Impacto:** Como Jarvis se ejecuta en cron jobs locales o en la nube que cierran el proceso al terminar (`process.exit()`), cualquier evento que falle por un microcorte de red y quede en cola para reintentarse en los siguientes minutos se perderá definitivamente.
*   **Mitigación:** Persistir la cola de eventos en una tabla dedicada en SQLite.

### 🟡 Riesgo 3: Consistencia en el Acceso a Datos (Riesgo Bajo/Medio)
*   **Diagnóstico:** A pesar de contar con la capa de resolución centralizada `lib/data/paths.js`, existen scripts de desarrollo y scrapers (ej. en `scripts/dev/`) que siguen consumiendo rutas relativas hardcodeadas (ej. `'data/cache/repos_db.json'`).
*   **Impacto:** Rompe el principio de "un único origen de verdad" y puede causar fallas de lectura si los scripts se ejecutan desde directorios de trabajo diferentes.
*   **Mitigación:** Refactorizar accesos a datos para importar las constantes de `paths.js`.

---

## 🛠️ 2. Plan de Implementación por Fases

### 📅 Fase A: Replicación de Base de Datos con Litestream (Seguridad)
*   **Objetivo:** Eliminar la dependencia de `actions/cache` de GitHub.
*   **Tareas:**
    1.  Crear una cuenta gratuita en Cloudflare R2 (10 GB de almacenamiento gratuito).
    2.  Habilitar e instalar Litestream (utilizando el archivo `litestream.yml` que ya se encuentra en tu raíz).
    3.  Configurar la replicación continua en tiempo real de `lifeos.db` y `memoria_hipocampo.db` hacia el bucket R2.
    4.  Actualizar los workflows de GitHub Actions para que restauren y repliquen la DB usando Litestream en lugar del caché de compilación.

### 📅 Fase B: Resiliencia de la Cola de Eventos (Event Bus)
*   **Objetivo:** Garantizar que ningún evento importante se pierda si el proceso de Node.js finaliza.
*   **Tareas:**
    1.  Crear una tabla llamada `event_queue` en SQLite (`lifeos.db`) a través de una migración en `runtime/migrations/`.
    2.  Modificar `event_bus.js` para que cada `emit()` guarde el evento en la base de datos con un estado de "pendiente".
    3.  Al finalizar un proceso corto, los eventos que fallen o requieran reintento se quedarán guardados de forma transaccional en la DB, listos para ser retomados por el siguiente ciclo de Jarvis (5 minutos después).

### 📅 Fase C: Unificación de Rutas (Portabilidad)
*   **Objetivo:** Garantizar que el sistema pueda moverse de carpetas o ejecutarse en Docker de forma transparente.
*   **Tareas:**
    1.  Escanear los archivos de las carpetas `scripts/dev/` y `scripts/jobs/`.
    2.  Reemplazar todas las rutas relativas estáticas de lectura de archivos por llamadas a la constante unificada `PATHS` importada de `lib/data/paths.js`.
