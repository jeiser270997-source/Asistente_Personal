# Especificaciones del PC (Host del Agente)
- **Device name:** dev
- **Processor:** AMD Ryzen 5 5600X 6-Core Processor (3.70 GHz)
- **RAM:** 32.0 GB
- **GPU:** NVIDIA GeForce GTX 1660 SUPER (6 GB VRAM)
- **Storage:** 331 GB of 1.38 TB used
- **OS:** 64-bit operating system, x64-based processor

## Análisis de Capacidades IA (Ollama)
- **Ventaja:** 32GB de RAM permiten manejar bases de datos vectoriales y scripts pesados sin problema.
- **Límite estricto:** 6GB de VRAM en la GPU. Un modelo como Llama 3.1 (8B) ocupa aprox 4.5GB - 5GB de VRAM. 
- **Estrategia:** El contexto inyectado en el prompt debe mantenerse estricto y pequeño para evitar que el modelo se desborde a la RAM normal (lo que lo haría muy lento). El enrutamiento semántico actual es la arquitectura perfecta para este hardware.