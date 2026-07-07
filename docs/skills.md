# Skills System

Sistema formal de habilidades sobre el Event Bus. Cada skill reacciona a un evento y genera nuevos eventos.

## Skill Engine

Archivo: `lib/skill_engine.js`

API:

```js
const engine = require('./lib/skill_engine');

engine.register(skill);  // Registrar una skill
engine.unregister(name); // Eliminar
engine.list();           // Listar todas
engine.enable(name);     // Activar
engine.disable(name);    // Desactivar
engine.init();           // Conectar al Event Bus
```

## Formato de una skill

```js
{
  name: 'job_apply',           // único
  description: 'Detecta postulaciones desde correos',
  trigger: 'email.processed',  // evento que la activa
  input: ['from', 'subject'],  // campos requeridos del payload
  version: '1.0.0',
  enabled: true,               // opcional, default true

  run({ payload, event, meta }) {
    // ...
    return {
      event: 'job.applied',    // evento a emitir
      payload: { ... },
      priority: 'normal',
    };
  },
}
```

## Skills registradas

| Skill | Trigger | Input | Output | Archivo |
|-------|---------|-------|--------|---------|
| `job_apply` | `email.processed` | `from, subject` | `job.applied` | `skills/job_apply.js` |
| `context_sync` | `email.important` | `from, subject` | `case.created` | `skills/context_sync.js` |

## Crear una skill nueva

```bash
# 1. Crear archivo en skills/
touch skills/mi_skill.js

# 2. Exportar objeto skill
module.exports = { name, trigger, input, run };

# 3. Registrar en el engine
engine.register(require('./skills/mi_skill'));
```

## Reglas

- Una skill solo debe hacer UNA cosa.
- El `run()` devuelve un evento o null.
- No lanzar errores directamente (el Event Bus maneja retry + DLQ).
- No acceder a stores directamente si hay un evento que lo haga por ti.
