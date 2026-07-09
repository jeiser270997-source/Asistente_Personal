# WheelSaver — Integración con LifeOS

**WheelSaver** es un scraper de GitHub + buscador offline + herramienta de auditoría IA.
Su base de datos local contiene **~23,000 repositorios** de GitHub con +500 estrellas,
indexados con FTS5 para búsquedas ultrarrápidas.

## Estructura

```
wheel-saver/               ← Subproyecto Python dentro de LifeOS
├── cli.py                 ← CLI unificado (Typer + Rich, 11 comandos)
├── api/                   ← FastAPI REST (8 endpoints)
├── scraper/               ← Motor de scraping (GitHub GraphQL API)
├── scripts/               ← Importadores (EvanLi, gitstar-ranking)
├── data/top_repos.db      ← Base SQLite ~23k repos con FTS5
├── frontend/              ← Dashboard web (Tabler CSS)
├── tests/                 ← ~18 tests con pytest
├── venv/                  ← Entorno virtual Python
└── requirements.txt       ← Dependencias Python
```

## Comandos vía LifeOS

```bash
# Buscar repositorios
npm run wheel:search -- "orm testing python"
npm run wheel:search -- "state management react" --language javascript --limit 10

# Estadísticas
npm run wheel:stats

# Top repositorios
npm run wheel:top -- 20
npm run wheel:top -- 10 --language rust

# Lenguajes disponibles
npm run wheel:languages

# Consultar IA con RAG (recomendación de librerías)
npm run wheel:ask -- "qué librería me recomiendas para hacer scraping?"

# Iniciar servidor API
npm run wheel:serve

# Verificar estado
npm run wheel:health
```

## Uso desde Node.js (API programática)

```javascript
const ws = require('./lib/integrations/wheel_saver_client');

// Búsqueda simple
const results = await ws.search('orm python');
console.log(results);

// Obtener estadísticas
const stats = await ws.stats();

// Top repos
const top = await ws.top(20, 'typescript');

// Consulta RAG
const answer = await ws.ask('qué librería para UI en React?');
```

## Skills de Claude AI importados

Los skills de Claude de WheelSaver se integraron en `.agents/skills/`:

| Skill | Archivo | Descripción |
|-------|---------|-------------|
| `wheel_saver` | `.agents/skills/wheel_saver/SKILL.md` | Auditoría completa de proyectos |
| `wheel-ready` | `.agents/skills/wheel_ready/SKILL.md` | Checklist de project readiness |
| `wheel-swap` | `.agents/skills/wheel_swap/SKILL.md` | Busca reemplazos de librerías |

## Event Bus

WheelSaver emite estos eventos en el Event Bus de LifeOS:

- `wheel_saver.search` — Resultados de búsqueda
- `wheel_saver.stats` — Estadísticas consultadas
- `wheel_saver.ask` — Consulta RAG respondida
- `wheel_saver.server.start` — Servidor API iniciado

## Mantenimiento

```bash
# Scrapear nuevos repos (actualizar DB)
cd wheel-saver && venv/Scripts/python cli.py scrape

# Importar desde EvanLi/Github-Ranking
cd wheel-saver && venv/Scripts/python cli.py import evanli

# Importar desde gitstar-ranking.com
cd wheel-saver && venv/Scripts/python cli.py import gitstar

# Ejecutar tests
cd wheel-saver && venv/Scripts/python -m pytest tests/ -v
```

## Variables de entorno

Agrega a `.env`:

```env
GITHUB_TOKEN=github_pat_...   # Para el scraper de GitHub
```

Los API keys de los LLM providers ya están en el `.env` de LifeOS y son
compartidas con WheelSaver.
