# Máquina de Estados de una Aplicación

```
                    ┌──────────┐
                    │ applied  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  viewed  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌────▼────┐    │
         │rejected│ │rejected │    │
         │ (filtro)│ │(entrev.)│    │
         └────────┘ └─────────┘    │
                                   │
                              ┌────▼─────┐
                              │interview │
                              └────┬─────┘
                                   │
                              ┌────▼────────┐
                              │technical_   │
                              │test         │
                              └────┬────────┘
                                   │
                              ┌────▼─────┐
                              │  offer   │
                              └────┬─────┘
                                   │
                          ┌────────┼────────┐
                          │        │        │
                     ┌────▼──┐ ┌───▼────┐   │
                     │accepted│ │declined│   │
                     └────────┘ └────────┘   │
                                        ┌────▼────┐
                                        │ ghosted │
                                        │ (30+ días│
                                        └─────────┘
```

## Transiciones válidas

| Desde | Hasta | Evento |
|-------|-------|--------|
| - | applied | application.created |
| applied | viewed | application.viewed |
| applied | rejected | application.rejected |
| viewed | interview | application.interview |
| viewed | rejected | application.rejected |
| interview | technical_test | application.technical_test |
| interview | rejected | application.rejected |
| technical_test | offer | application.offer |
| technical_test | rejected | application.rejected |
| offer | accepted | application.accepted |
| offer | declined | application.declined |
| applied | ghosted | timeout 30 días sin cambios |

## Eventos del FeedbackEngine

Cada transición emite un `ApplicationEvent` que el FeedbackEngine consume para ajustar pesos.
