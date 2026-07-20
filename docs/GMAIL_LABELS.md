# Gmail — esquema de etiquetas LifeOS

## Política

- **Default fail-safe:** solo etiquetas, no trash, inbox intacto.
- El procesador usa las mismas rutas que `data/config/rules.json`.
- Limpieza/reorg: `node scripts/maintenance/gmail_calendar_cleanup.js`

## Árbol canónico

```
LifeOS/
  Importante
  BajoSenal          ← ex "Basura" (no se borra el mail)
Gobierno/
  General · SIMIT · DIAN
Educacion/
  SENA · CESDE
Trabajo/
  Postulaciones · LinkedIn · Indeed · Entrevistas · Rechazos · Plataformas
Finanzas/
  Bancolombia · Facturas · DiDi · Uber · EPM · Billeteras · Cobranzas
Compras/
  MercadoLibre · Amazon
Leer/
  GitHub · Newsletters
Seguridad/
  Alerts
Sistema
```

## Migración de basura vieja

| Antes | Después |
|-------|---------|
| `Basura` | `LifeOS/BajoSenal` (luego se borra la etiqueta Basura) |
| `Empleo` | `Trabajo/Postulaciones` |
| `Educacion` (plana) | `Educacion/SENA` |
| `Finanzas` (plana) | `Finanzas/Facturas` |
| `Transito` | `Gobierno/SIMIT` |
| `Seguridad` (plana) | `Seguridad/Alerts` |

Etiquetas `[Imap]/*` se dejan (cliente de mail externo).

## Calendar

LifeOS **no crea** eventos (alarmas manuales).  
Limpieza: el script hace `calendars.clear` del **primary**.  
No borra suscripciones (ej. Festivos Colombia).

## Comandos

```bash
# Ver qué haría
node scripts/maintenance/gmail_calendar_cleanup.js --dry-run

# Aplicar labels + vaciar calendar
node scripts/maintenance/gmail_calendar_cleanup.js

# Solo uno
node scripts/maintenance/gmail_calendar_cleanup.js --labels-only
node scripts/maintenance/gmail_calendar_cleanup.js --calendar-only
```

Requiere `credentials.json` + `.google_token.json` con scopes Gmail + Calendar.
