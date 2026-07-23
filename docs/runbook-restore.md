# Runbook de Recuperación ante Desastres y Mantenimiento (LifeOS)

> [!IMPORTANT]
> Este documento describe el protocolo paso a paso para restaurar LifeOS en caso de fallo del sistema, pérdida de disco o migración de equipo.

---

## 1. Recuperación de la Base de Datos (SQLite WAL)

### Opción A: Desde Copia Local / Google Drive (`LifeOS_Backups`)
1. Descargar el archivo `memoria_hipocampo_YYYY-MM-DD.db` más reciente desde la carpeta `LifeOS_Backups` en Google Drive.
2. Copiarlo a la ruta canónica: `data/memoria_hipocampo.db`.
3. Verificar la integridad de la base de datos:
   ```bash
   sqlite3 data/memoria_hipocampo.db "PRAGMA quick_check;"
   ```

### Opción B: Desde Replicación Litestream (Cloudflare R2)
1. Ejecutar el comando de restauración de Litestream:
   ```bash
   litestream restore -o data/memoria_hipocampo.db -config etc/litestream.yml -replica s3 memoria_hipocampo
   ```
2. Validar el número de eventos en el registro:
   ```bash
   sqlite3 data/memoria_hipocampo.db "SELECT COUNT(*) FROM ledger;"
   ```

---

## 2. Configuración Inicial del Entorno (Fresh Clone / Disaster Recovery)

Para levantar LifeOS desde cero en un entorno limpio:

```powershell
# Ejecutar el script automatizado de preparación
.\setup.ps1
```

El script verificará automáticamente:
- Versión de Node.js (18+) y dependencias de `package.json`.
- Existencia de `.env` con las variables clave (`SENA_MOODLE_USER`, `GOOGLE_CLIENT_ID`, etc.).
- Presencia y salud de `data/memoria_hipocampo.db`.
- Re-indexación de skills (`npm run skills:reindex`).
- Paso limpio de la suite de pruebas (`npm test`).

---

## 3. Rotación de Credenciales y Tokens

Si un token o credencial se ve comprometido o expira:

* **Google Master Token:**
  Borrar `.google_token.json` y ejecutar `node scripts/integrations/drive_cleaner.js` para forzar la re-autenticación OAuth2 por navegador.
* **Dashboard Token:**
  Actualizar `DASHBOARD_TOKEN` en `.env`.

---

## 4. Diagnóstico de Scrapers Rotos

Si un scraper de SENA, SIMIT o Computrabajo falla por cambios de HTML:

```bash
# Correr el healthcheck de scrapers
npm run test:scrapers

# Diagnóstico de rutas y stores
npm run runtime:ci
```

---

## 5. Política Anti-Ciclo de Auditoría (Regla de los 90 Días)

- **Máximo 1 auditoría por trimestre.**
- Próxima auditoría autorizada: **No antes de Octubre 2026**, salvo trigger válido (fallo ejecutable reproducible o regresión de pruebas).
