# Fuentes — Leyes de Murphy y Postmortem

### Leyes Clasicas de Murphy
- **Ley Principal**: "Si algo puede salir mal, saldra mal."
- **Corolario de Edsel**: "Tan pronto como haces algo bien, alguien cambia las reglas."
- **Ley de Evans**: "Si puedes mantener la cabeza cuando todos a tu alrededor la pierden, es que no has entendido el problema."
- **Ley de O Toole**: "Un experto es una persona que ha cometido todos los errores posibles en un campo muy reducido."
- **Tercera Ley de Chisholm**: "Cualquier propuesta que contenga mas de una parte sera malinterpretada en la parte mas critica."

### Principios de Postmortem Blameless (SRE)
1. **Sin culpa individual**: Los sistemas deben ser resilientes a errores humanos inevitables.
2. **Regla de Causa Raiz**: Un fallo nunca es 'error humano'; es falta de salvaguarda o proceso claro.
3. **Accion accionable**: Todo postmortem debe generar un cambio de codigo, regla JSON o test automatico.
