This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: wheel-saver/api/**, wheel-saver/scraper/**, wheel-saver/cli.py
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
wheel-saver/api/__init__.py
wheel-saver/api/database.py
wheel-saver/api/llm.py
wheel-saver/api/main.py
wheel-saver/api/repository.py
wheel-saver/cli.py
wheel-saver/scraper/__init__.py
wheel-saver/scraper/db_manager.py
wheel-saver/scraper/github_fetcher.py
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="wheel-saver/api/__init__.py">
"""WheelSaver API package."""
</file>

<file path="wheel-saver/api/database.py">
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "top_repos.db")


async def get_db():
    """Dependencia de FastAPI para obtener una sesión asíncrona de BD."""
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("PRAGMA journal_mode=WAL;")
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
</file>

<file path="wheel-saver/api/llm.py">
"""
WheelSaver LLM — Proveedor multi-LLM con fallback automático.

Soporta múltiples proveedores free tier (OpenAI-compatible + Google Gemini + Cohere)
y hace failover automático si uno falla (rate limit, timeout, etc.).

Para agregar un nuevo proveedor:
  1. Agrega su config en _OPENAI_COMPATIBLE o _NATIVE_PROVIDERS
  2. Implementa su handler en _ask_* (si no es OpenAI-compatible)
  3. Agrega la API key al .env
"""

import os
import json
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# Configuración de proveedores
# ──────────────────────────────────────────────────────────────────────────────

# Proveedores con API compatible con OpenAI (reusan AsyncOpenAI)
_OPENAI_COMPATIBLE = [
    {
        "name": "groq",
        "env_key": "GROQ_API_KEY",
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    {
        "name": "cerebras",
        "env_key": "CEREBRAS_API_KEY",
        "base_url": "https://api.cerebras.ai/v1",
        "model": "llama-3.3-70b",
    },
    {
        "name": "openrouter",
        "env_key": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "google/gemini-2.0-flash-exp:free",
    },
    {
        "name": "nvidia",
        "env_key": "NVIDIA_API_KEY",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "model": "meta/llama-3.1-70b-instruct",
    },
    {
        "name": "sambanova",
        "env_key": "SAMBANOVA_API_KEY",
        "base_url": "https://api.sambanova.ai/v1",
        "model": "Meta-Llama-3.1-70B-Instruct",
    },
    {
        "name": "mistral",
        "env_key": "MISTRAL_API_KEY",
        "base_url": "https://api.mistral.ai/v1",
        "model": "mistral-small-latest",
    },
    {
        "name": "huggingface",
        "env_key": "HF_API_KEY",
        "base_url": "https://api-inference.huggingface.co/v1/",
        "model": "meta-llama/Llama-3.1-70B-Instruct",
    },
]

# Proveedores con API nativa (no OpenAI-compatible)
_NATIVE_PROVIDERS = [
    {
        "name": "google",
        "env_key": "GOOGLE_API_KEY",
        "handler": "_ask_google",
        "model": "gemini-1.5-flash",
    },
    {
        "name": "google-2",
        "env_key": "GOOGLE_API_KEY_2",
        "handler": "_ask_google",
        "model": "gemini-1.5-flash",
    },
    {
        "name": "cohere",
        "env_key": "COHERE_API_KEY",
        "handler": "_ask_cohere",
        "model": "command-r-plus",
    },
]


def _get_active_providers():
    """Retorna lista de proveedores configurados (con API key presente)."""
    providers = []

    # OpenAI-compatible con prioridad ascendente (menor número = más prioritario)
    for i, cfg in enumerate(_OPENAI_COMPATIBLE):
        api_key = os.getenv(cfg["env_key"])
        if api_key:
            providers.append({
                "name": cfg["name"],
                "api_key": api_key,
                "base_url": cfg["base_url"],
                "model": cfg["model"],
                "priority": i + 1,
                "type": "openai",
            })

    # Proveedores nativos
    for i, cfg in enumerate(_NATIVE_PROVIDERS):
        api_key = os.getenv(cfg["env_key"])
        if api_key:
            providers.append({
                "name": cfg["name"],
                "api_key": api_key,
                "handler": cfg["handler"],
                "model": cfg["model"],
                "priority": len(_OPENAI_COMPATIBLE) + i + 1,
                "type": "native",
            })

    # Ordenar por prioridad
    providers.sort(key=lambda p: p["priority"])
    return providers


def _build_prompts(question: str, repos: list[dict]) -> tuple[str, str]:
    """Construye system_prompt y user_prompt para consulta RAG."""
    context = ""
    for r in repos:
        desc = r.get("description", "Sin descripción") or "Sin descripción"
        lang = r.get("language", "-") or "-"
        context += f"- {r['owner']}/{r['name']} ({r.get('stars', 0)}⭐): {desc}. Lenguaje: {lang}\n"

    if not context:
        context = "No se encontraron repositorios relevantes en la base de datos."

    system_prompt = """Eres WheelSaver AI, un ingeniero de software senior altamente experimentado.
Tu objetivo es analizar la pregunta del usuario y responder recomendando los mejores repositorios basándote estrictamente en el contexto proporcionado (los resultados de la base de datos local).
Sé directo, explica brevemente por qué recomiendas una librería sobre otra, y usa un formato Markdown limpio."""

    user_prompt = f"""Pregunta del usuario: "{question}"

Contexto extraído de la base de datos de WheelSaver:
{context}

Por favor, analiza estos repositorios y responde a la pregunta de la mejor manera posible."""

    return system_prompt, user_prompt


# ──────────────────────────────────────────────────────────────────────────────
# Handlers por tipo de proveedor
# ──────────────────────────────────────────────────────────────────────────────

async def _ask_openai_compatible(provider: dict, system_prompt: str, user_prompt: str, **kwargs) -> str:
    """Consulta a un proveedor con API compatible con OpenAI."""
    client = AsyncOpenAI(
        api_key=provider["api_key"],
        base_url=provider["base_url"],
    )
    response = await client.chat.completions.create(
        model=provider["model"],
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=kwargs.get("max_tokens", 800),
        temperature=kwargs.get("temperature", 0.3),
    )
    return response.choices[0].message.content


async def _ask_google(provider: dict, system_prompt: str, user_prompt: str, **kwargs) -> str:
    """Consulta a Google Gemini API vía REST."""
    model = kwargs.get("model", provider["model"])
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
        f":generateContent?key={provider['api_key']}"
    )

    payload = {
        "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
        "generationConfig": {
            "maxOutputTokens": kwargs.get("max_tokens", 800),
            "temperature": kwargs.get("temperature", 0.3),
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            # Incluir info de bloqueo de seguridad si existe
            block_reason = data.get("promptFeedback", {}).get("blockReason", "desconocido")
            raise RuntimeError(
                f"Google Gemini: respuesta vacía o bloqueada. "
                f"blockReason={block_reason}. "
                f"Respuesta completa: {json.dumps(data, indent=2)[:500]}"
            ) from e


async def _ask_cohere(provider: dict, system_prompt: str, user_prompt: str, **kwargs) -> str:
    """Consulta a Cohere API vía REST."""
    model = kwargs.get("model", provider["model"])
    url = "https://api.cohere.ai/v1/chat"

    payload = {
        "model": model,
        "message": user_prompt,
        "preamble": system_prompt,
        "max_tokens": kwargs.get("max_tokens", 800),
        "temperature": kwargs.get("temperature", 0.3),
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {provider['api_key']}"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["text"]


# ──────────────────────────────────────────────────────────────────────────────
# Handler router
# ──────────────────────────────────────────────────────────────────────────────

_OPENAI_HANDLERS = {
    "groq": _ask_openai_compatible,
    "cerebras": _ask_openai_compatible,
    "openrouter": _ask_openai_compatible,
    "nvidia": _ask_openai_compatible,
    "sambanova": _ask_openai_compatible,
    "mistral": _ask_openai_compatible,
    "huggingface": _ask_openai_compatible,
}

_NATIVE_HANDLERS = {
    "google": _ask_google,
    "google-2": _ask_google,
    "cohere": _ask_cohere,
}


async def ask_llm(system_prompt: str = "", user_prompt: str = "", **kwargs) -> str:
    """
    Consulta al mejor LLM disponible entre los proveedores configurados.
    Hace failover automático: si el primero falla, prueba el siguiente.

    Args:
        system_prompt: Instrucciones de sistema para el modelo.
        user_prompt: Pregunta o instrucción del usuario.
        **kwargs: max_tokens, temperature, etc.

    Returns:
        Respuesta del primer proveedor que responda exitosamente.

    Raises:
        RuntimeError: Si todos los proveedores fallan.
    """
    providers = _get_active_providers()
    if not providers:
        raise RuntimeError(
            "No hay proveedores LLM configurados. "
            "Revisa tu archivo .env — necesitas al menos una API key "
            "(GROQ_API_KEY, CEREBRAS_API_KEY, GOOGLE_API_KEY, etc.)"
        )

    errors = []
    for provider in providers:
        try:
            if provider["type"] == "openai":
                handler = _OPENAI_HANDLERS.get(provider["name"], _ask_openai_compatible)
                return await handler(provider, system_prompt, user_prompt, **kwargs)
            else:  # native
                handler = _NATIVE_HANDLERS.get(provider["name"])
                if handler:
                    return await handler(provider, system_prompt, user_prompt, **kwargs)
                else:
                    errors.append(f"{provider['name']}: handler desconocido")
                    continue
        except Exception as e:
            err_msg = f"{provider['name']} ({provider.get('model', '?')}): {e}"
            errors.append(err_msg)
            continue

    raise RuntimeError(
        "Todos los proveedores LLM fallaron.\n" + "\n".join(f"  - {e}" for e in errors)
    )


# ──────────────────────────────────────────────────────────────────────────────
# Función principal para RAG (backwards compatible + mejorada)
# ──────────────────────────────────────────────────────────────────────────────

async def ask_llm_about_repos(question: str, repos: list[dict], **kwargs) -> str:
    """
    Toma una pregunta del usuario y una lista de repositorios (obtenidos de la DB local),
    y usa el mejor LLM disponible para razonar y dar una respuesta experta.

    Args:
        question: Pregunta del usuario sobre repositorios/librerías.
        repos: Lista de diccionarios con datos de repositorios.
        **kwargs: Parámetros adicionales para el LLM (max_tokens, temperature).

    Returns:
        Respuesta en Markdown del LLM.
    """
    system_prompt, user_prompt = _build_prompts(question, repos)

    try:
        return await ask_llm(system_prompt=system_prompt, user_prompt=user_prompt, **kwargs)
    except RuntimeError as e:
        return f"Error al generar respuesta: {e}"


# ─── Alias backwards-compatible ───────────────────────────────────────────────
ask_deepseek_about_repos = ask_llm_about_repos
</file>

<file path="wheel-saver/api/main.py">
"""
WheelSaver API — FastAPI REST API para consultar la BD de repos.

Uso:
    python cli.py api
    # o
    uvicorn api.main:app --reload

Documentacion automatica: http://localhost:8000/docs
"""

from fastapi import FastAPI, Query, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import aiosqlite

from api.database import get_db
from api.repository import (
    search_repos_async,
    search_repos_multi_keywords_async,
    get_stats_async,
    get_repo_async,
    get_languages_async,
    list_repos_async,
    get_top_async,
)

app = FastAPI(
    title="WheelSaver API",
    description="Busca y analiza repositorios de GitHub desde la base de datos local de WheelSaver. RAG multi-proveedor con failover automático.",
    version="3.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return RedirectResponse(url="/web/index.html")


@app.get("/health")
async def health(db: aiosqlite.Connection = Depends(get_db)):
    """Healthcheck simple."""
    stats = await get_stats_async(db)
    return {"status": "ok", "version": "3.0.0", "repos": stats["total_repos"]}


@app.get("/search")
async def search(
    q: str = Query(..., description="Keyword(s) para buscar"),
    limit: int = Query(10, ge=1, le=100, description="Max resultados"),
    language: str = Query(None, description="Filtrar por lenguaje"),
    min_stars: int = Query(0, ge=0, description="Estrellas minimas"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Busqueda full-text en la base de datos (FTS5 + fallback LIKE)."""
    keywords = [kw.strip() for kw in q.split() if kw.strip()]
    if not keywords:
        return {"query": q, "repos": [], "total": 0}

    if len(keywords) == 1:
        repos = await search_repos_async(db, keywords[0], limit=limit)
    else:
        repos = await search_repos_multi_keywords_async(db, keywords, limit=limit)

    # Filtros post-query
    if language:
        repos = [r for r in repos if r["language"].lower() == language.lower()]
    if min_stars:
        repos = [r for r in repos if r["stars"] >= min_stars]

    return {"query": q, "repos": repos[:limit], "total": len(repos[:limit])}


@app.get("/stats")
async def api_stats(db: aiosqlite.Connection = Depends(get_db)):
    """Estadisticas de la base de datos."""
    return await get_stats_async(db)


@app.get("/repos/{owner}/{name}")
async def get_repo(owner: str, name: str, db: aiosqlite.Connection = Depends(get_db)):
    """Obtener un repositorio por owner y nombre."""
    repo = await get_repo_async(db, owner, name)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositorio no encontrado")
    return repo


@app.get("/languages")
async def languages(
    limit: int = Query(50, ge=1, le=200, description="Max lenguajes"),
    min_repos: int = Query(1, ge=1, description="Min repos por lenguaje"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Lista de lenguajes de programacion con cantidad de repos."""
    langs = await get_languages_async(db, min_repos=min_repos, limit=limit)
    return {"languages": langs}


@app.get("/repos")
async def list_repos(
    page: int = Query(1, ge=1, description="Numero de pagina"),
    per_page: int = Query(50, ge=1, le=200, description="Repos por pagina"),
    language: str = Query(None, description="Filtrar por lenguaje"),
    sort: str = Query("stars", description="Ordenar por: stars, name, updated_at"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Lista paginada de repositorios."""
    order_col = (
        "stars" if sort == "stars" else (sort if sort in ("name", "updated_at") else "stars")
    )
    offset = (page - 1) * per_page
    repos = await list_repos_async(
        db, order_col=order_col, language=language, per_page=per_page, offset=offset
    )
    return {"page": page, "per_page": per_page, "repos": repos, "total": len(repos)}


@app.get("/top")
async def top(
    limit: int = Query(10, ge=1, le=100, description="Cuantos top repos"),
    language: str = Query(None, description="Filtrar por lenguaje"),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Top repositorios por estrellas."""
    repos = await get_top_async(db, limit=limit, language=language)
    return {"limit": limit, "repos": repos}


@app.post("/scrape")
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    min_stars: int = Query(500, ge=10, description="Estrellas minimas para buscar"),
):
    """Lanza el scraper de GitHub de forma asíncrona en el mismo proceso."""
    from scraper.github_fetcher import fetch_top_repos
    background_tasks.add_task(fetch_top_repos, min_stars)
    return {"status": "ok", "message": f"Scraper iniciado (min_stars={min_stars})"}


from pydantic import BaseModel
class AskRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_agent(
    req: AskRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Realiza una consulta al LLM multi-proveedor (RAG) usando repositorios como contexto. Failover automático entre free tiers."""
    from api.llm import ask_llm_about_repos

    # Extraer posibles keywords de la pregunta para buscar contexto
    keywords = [kw.strip() for kw in req.question.replace("?", "").replace("¿", "").split() if len(kw) > 3]

    if len(keywords) == 1:
        repos = await search_repos_async(db, keywords[0], limit=10)
    else:
        repos = await search_repos_multi_keywords_async(db, keywords, limit=10)

    answer = await ask_llm_about_repos(req.question, repos)
    return {"question": req.question, "context_repos_used": len(repos), "answer": answer}

app.mount("/web", StaticFiles(directory="frontend", html=True), name="frontend")
</file>

<file path="wheel-saver/api/repository.py">
import aiosqlite
from async_lru import alru_cache
import logging

async def search_repos_async(db: aiosqlite.Connection, keyword: str, limit: int = 5):
    """Busqueda vectorial/full-text en SQLite (FTS5 + fallback LIKE)."""
    try:
        cursor = await db.execute(
            """
            SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (keyword, limit),
        )
        results = await cursor.fetchall()

        if not results:
            cursor = await db.execute(
                """
                SELECT name, owner, description, url, stars, language, topics
                FROM repos
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY stars DESC
                LIMIT ?
                """,
                (f"%{keyword}%", f"%{keyword}%", limit),
            )
            results = await cursor.fetchall()

        return [dict(r) for r in results]
    except Exception as e:
        logging.error(f"Error búsqueda asíncrona: {e}")
        return []

async def search_repos_multi_keywords_async(
    db: aiosqlite.Connection, keywords: list[str], limit: int = 5
):
    """Busqueda con multiples keywords en FTS5 (AND) con fallback individual (OR)."""
    if not keywords:
        return []

    fts_query_and = " AND ".join(f'"{kw}"' for kw in keywords)

    try:
        cursor = await db.execute(
            """
            SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (fts_query_and, limit),
        )
        results = await cursor.fetchall()

        if len(results) < limit:
            results_list = [dict(r) for r in results]
            seen = {r["name"] for r in results_list}

            fts_query_or = " OR ".join(f'"{kw}"' for kw in keywords)
            cursor = await db.execute(
                """
                SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
                FROM repos_fts f
                JOIN repos r ON r.rowid = f.rowid
                WHERE repos_fts MATCH ?
                ORDER BY rank
                LIMIT ?
                """,
                (fts_query_or, limit * 2),
            )
            fallback_results = await cursor.fetchall()

            for r in fallback_results:
                r_dict = dict(r)
                if r_dict["name"] not in seen:
                    seen.add(r_dict["name"])
                    results_list.append(r_dict)
                    if len(results_list) >= limit:
                        break
            return results_list
        return [dict(r) for r in results]
    except Exception as e:
        logging.error(f"Error búsqueda asíncrona multi-keyword: {e}")
        return []


@alru_cache(maxsize=32)
async def get_stats_async(db: aiosqlite.Connection):
    stats = {}
    cursor = await db.execute("SELECT COUNT(*) as count FROM repos")
    row = await cursor.fetchone()
    stats["total_repos"] = row["count"]

    cursor = await db.execute(
        "SELECT MIN(stars) as min_s, MAX(stars) as max_s, AVG(stars) as avg_s FROM repos"
    )
    row = await cursor.fetchone()
    stats["stars_min"] = row["min_s"]
    stats["stars_max"] = row["max_s"]
    stats["stars_avg"] = round(row["avg_s"]) if row["avg_s"] else 0

    cursor = await db.execute(
        'SELECT COUNT(DISTINCT language) as cnt FROM repos WHERE language != ""'
    )
    row = await cursor.fetchone()
    stats["languages"] = row["cnt"]

    cursor = await db.execute("""
        SELECT language, COUNT(*) as cnt FROM repos
        WHERE language != "" GROUP BY language ORDER BY cnt DESC LIMIT 10
    """)
    top_langs = await cursor.fetchall()
    stats["top_languages"] = {r["language"]: r["cnt"] for r in top_langs}

    return stats


async def get_repo_async(db: aiosqlite.Connection, owner: str, name: str):
    cursor = await db.execute(
        "SELECT * FROM repos WHERE owner = ? AND name = ?",
        (owner, name),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


@alru_cache(maxsize=32)
async def get_languages_async(db: aiosqlite.Connection, min_repos: int, limit: int):
    cursor = await db.execute(
        """SELECT language, COUNT(*) as count FROM repos
           WHERE language != '' GROUP BY language
           HAVING count >= ? ORDER BY count DESC LIMIT ?""",
        (min_repos, limit),
    )
    langs = await cursor.fetchall()
    return [{"language": r["language"], "repos": r["count"]} for r in langs]


async def list_repos_async(
    db: aiosqlite.Connection, order_col: str, language: str, per_page: int, offset: int
):
    if language:
        cursor = await db.execute(
            f"SELECT * FROM repos WHERE language = ? ORDER BY {order_col} DESC LIMIT ? OFFSET ?",
            (language, per_page, offset),
        )
    else:
        cursor = await db.execute(
            f"SELECT * FROM repos ORDER BY {order_col} DESC LIMIT ? OFFSET ?",
            (per_page, offset),
        )
    repos = await cursor.fetchall()
    return [dict(r) for r in repos]


async def get_top_async(db: aiosqlite.Connection, limit: int, language: str):
    if language:
        cursor = await db.execute(
            "SELECT * FROM repos WHERE language = ? ORDER BY stars DESC LIMIT ?",
            (language, limit),
        )
    else:
        cursor = await db.execute(
            "SELECT * FROM repos ORDER BY stars DESC LIMIT ?",
            (limit,),
        )
    repos = await cursor.fetchall()
    return [dict(r) for r in repos]
</file>

<file path="wheel-saver/cli.py">
#!/usr/bin/env python3
"""
WheelSaver CLI — Punto de entrada unificado para WheelSaver.

Uso:
    python cli.py search <keywords...> [--limit N] [--language L] [--min-stars N]
    python cli.py stats
    python cli.py scrape [--min-stars N]
    python cli.py import evanli
    python cli.py import gitstar [--pages N] [--start N]
    python cli.py api [--host H] [--port P]
    python cli.py ready                            # Checklist de proyecto
    python cli.py swap <feature>                   # Busca alternativa a lo que codeas
"""

import re
import os
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.rule import Rule

app = typer.Typer(
    name="wheelsaver",
    help="WheelSaver — GitHub repo scraper, search & audit tool",
    no_args_is_help=True,
)
import_group = typer.Typer(help="Import data from external sources")
app.add_typer(import_group, name="import")

console = Console()


# Sanitizador para Windows cp1252 — limpia emojis y no-ASCII
def clean(text, max_len=80):
    """Limpia texto para terminal Windows (cp1252)."""
    if not text:
        return ""
    # Remueve todo lo que no sea ASCII imprimible (+ acentos comunes)
    cleaned = re.sub(r"[^\x20-\x7EÀ-ÿĀ-ſ]", "", text)
    return cleaned[:max_len] + "..." if len(text) > max_len else cleaned


@app.command()
def search(
    keywords: list[str] = typer.Argument(
        ..., help="Keywords para buscar (FTS5 sobre name, description, topics)"
    ),
    limit: int = typer.Option(20, "--limit", "-l", help="Max resultados"),
    language: str = typer.Option(
        None, "--language", help="Filtrar por lenguaje (ej: Python, Rust)"
    ),
    min_stars: int = typer.Option(None, "--min-stars", help="Estrellas minimas"),
):
    """Busca repos en la base de datos usando FTS5."""
    from scraper.db_manager import search_repos_multi_keywords

    results = search_repos_multi_keywords(keywords, limit=limit * 3)

    # Filtros post-query
    if language:
        results = [r for r in results if r["language"].lower() == language.lower()]
    if min_stars:
        results = [r for r in results if r["stars"] >= min_stars]

    results = results[:limit]

    if not results:
        console.print("[yellow]No se encontraron repositorios.[/yellow]")
        raise typer.Exit()

    table = Table(
        title=f"Resultados para: {' '.join(keywords)}",
        caption=f"{len(results)} repos mostrados",
    )
    table.add_column("Nombre", style="cyan", no_wrap=True)
    table.add_column("Owner", style="green")
    table.add_column("Estrellas", justify="right", style="bold yellow")
    table.add_column("Lenguaje", style="magenta")
    table.add_column("Descripcion", no_wrap=False)

    for r in results:
        desc = clean(r.get("description"), 80)
        table.add_row(r["name"], r["owner"], f"{r['stars']:,}", r["language"] or "-", desc)

    console.print(table)


@app.command()
def stats():
    """Muestra estadisticas de la base de datos."""
    from scraper.db_manager import get_stats

    s = get_stats()

    panel = Panel(
        f"[bold]Total repos:[/bold] {s['total_repos']:,}\n"
        f"[bold]Lenguajes:[/bold] {s['languages']}\n"
        f"[bold]Estrellas:[/bold] "
        f"min [green]{s['stars_min']:,}[/green] / "
        f"max [yellow]{s['stars_max']:,}[/yellow] / "
        f"avg [cyan]{s['stars_avg']:,}[/cyan]",
        title="WheelSaver DB Stats",
        border_style="blue",
    )
    console.print(panel)

    if s.get("top_languages"):
        table = Table("Lenguaje", "Repos", title="Top 10 Lenguajes")
        for lang, cnt in s["top_languages"].items():
            table.add_row(lang, f"{cnt:,}")
        console.print(table)


@app.command()
def scrape(
    min_stars: int = typer.Option(500, "--min-stars", help="Umbral minimo de estrellas"),
):
    """Ejecuta el scraper de GitHub GraphQL (barre desde Top 1 hacia abajo)."""
    from scraper.github_fetcher import fetch_top_repos

    console.print(f"[bold blue]Iniciando scraper GraphQL...[/bold blue]")
    fetch_top_repos(min_stars=min_stars)


@import_group.command(name="evanli")
def import_evanli():
    """Importa Top 100 por lenguaje desde EvanLi/Github-Ranking."""
    from scripts.import_from_evanli import main as evanli_main

    console.print("[bold blue]Importando desde EvanLi/Github-Ranking...[/bold blue]")
    evanli_main()
    console.print("[bold green]Importacion EvanLi completada.[/bold green]")


@import_group.command(name="gitstar")
def import_gitstar(
    pages: int = typer.Option(0, "--pages", "-p", help="Numero de paginas (0 = todas, max 100)"),
):
    """Scrapea gitstar-ranking.com para rankings de repos."""
    import sys
    import scripts.scrape_gitstar_ranking as gs

    console.print("[bold blue]Scrapeando gitstar-ranking.com...[/bold blue]")

    # Guardar args originales y poner los nuestros
    old_argv = sys.argv
    args = (
        ["scrape_gitstar_ranking.py", f"--pages={pages}"]
        if pages
        else ["scrape_gitstar_ranking.py"]
    )
    sys.argv = args
    try:
        gs.main()
    finally:
        sys.argv = old_argv
    console.print("[bold green]Scrapeo gitstar-ranking completado.[/bold green]")


@app.command()
def api(
    host: str = typer.Option("0.0.0.0", "--host", help="Direccion de escucha"),
    port: int = typer.Option(8000, "--port", "-p", help="Puerto"),
):
    """Lanza el servidor FastAPI con la API REST."""
    import uvicorn

    console.print(f"[bold blue]Lanzando API en http://{host}:{port}[/bold blue]")
    console.print("[dim]Documentacion: http://localhost:" + str(port) + "/docs[/dim]")
    uvicorn.run("api.main:app", host=host, port=port, reload=True)


@app.command()
def docker():
    """Levanta WheelSaver en Docker (docker compose up)."""
    import subprocess, sys

    console.print("[bold blue]Levantando WheelSaver con Docker...[/bold blue]")
    result = subprocess.run(
        [sys.executable, "-m", "docker", "compose", "up", "--build", "-d"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    if result.returncode == 0:
        console.print("[bold green]WheelSaver corriendo en http://localhost:8000[/bold green]")
        console.print("[dim]Para ver logs: docker compose logs -f[/dim]")
        console.print("[dim]Para detener: docker compose down[/dim]")
    else:
        console.print("[red]Error al levantar Docker:[/red]")
        console.print(result.stderr or result.stdout)


@app.command()
def dashboard():
    """Lanza el dashboard web con Streamlit."""
    import subprocess, sys

    console.print("[bold blue]Lanzando dashboard Streamlit...[/bold blue]")
    subprocess.run(
        [sys.executable, "-m", "streamlit", "run", "dashboard.py"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )


@app.command()
def ready(
    path: str = typer.Option(".", "--path", help="Ruta del proyecto a analizar"),
):
    """Escanea un proyecto y genera checklist de lo que le falta."""
    import os
    from pathlib import Path

    target = Path(path).resolve()
    console.print(f"[bold]Analizando proyecto:[/bold] {target}")
    console.print()

    # Detectar stack
    has_python = (
        (target / "requirements.txt").exists()
        or (target / "pyproject.toml").exists()
        or (target / "Pipfile").exists()
    )
    has_js = (target / "package.json").exists()
    has_rust = (target / "Cargo.toml").exists()
    has_go = (target / "go.mod").exists()
    has_docker = (target / "Dockerfile").exists() or (target / "docker-compose.yml").exists()
    has_ci = (target / ".github" / "workflows").exists()
    has_tests = any((target / d).exists() for d in ["tests", "test", "__tests__", "spec"])
    has_readme = (target / "README.md").exists()
    has_git = (target / ".git").exists()
    has_env = (target / ".env").exists() or (target / ".env.example").exists()
    has_gitignore = (target / ".gitignore").exists()

    # Detectar frameworks
    framework = ""
    if has_js and (target / "package.json").exists():
        import json

        try:
            pkg = json.loads((target / "package.json").read_text())
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "next" in deps:
                framework = "Next.js"
            elif "react" in deps:
                framework = "React"
            elif "vue" in deps:
                framework = "Vue"
            elif "svelte" in deps:
                framework = "Svelte"
            elif "express" in deps:
                framework = "Express"
            has_tests = has_tests or "jest" in deps or "vitest" in deps or "cypress" in deps
            has_ci = has_ci or "husky" in deps or "lint-staged" in deps
        except:
            pass
    elif has_python and (target / "requirements.txt").exists():
        content = (target / "requirements.txt").read_text().lower()
        if "fastapi" in content:
            framework = "FastAPI"
        elif "django" in content:
            framework = "Django"
        elif "flask" in content:
            framework = "Flask"
        has_tests = has_tests or "pytest" in content

    # Determinar stack
    stacks = []
    if has_python:
        stacks.append("Python")
    if has_js:
        stacks.append("JavaScript/TypeScript")
    if has_rust:
        stacks.append("Rust")
    if has_go:
        stacks.append("Go")
    stack_str = " + ".join(stacks) if stacks else "No detectado"

    console.print(
        Panel(
            f"[bold]Stack:[/bold] {stack_str}\n"
            f"[bold]Framework:[/bold] {framework or 'No detectado'}\n"
            f"[bold]Ruta:[/bold] {target}",
            title="Proyecto Detectado",
            border_style="blue",
        )
    )

    # Checklist
    checks = [
        ("🔬 Testing", has_tests, "testing", "pytest jest vitest playwright"),
        ("🚀 CI/CD", has_ci, "devops", "ci/cd actions deployment"),
        ("🐳 Docker", has_docker, "devops", "docker container dockerfile"),
        ("📝 README", has_readme, "docs", "documentation readme"),
        ("🔐 .env / Secrets", has_env, "security", "dotenv environment secrets"),
        ("📋 .gitignore", has_gitignore, "git", "gitignore template"),
        ("🔧 Git", has_git, "git", "git version-control"),
    ]

    table = Table(title="Checklist del Proyecto")
    table.add_column("Estado", justify="center")
    table.add_column("Categoria", style="bold")
    table.add_column("Recomendacion")

    missing_categories = []

    for label, ok, cat, keywords in checks:
        if ok:
            table.add_row("✅", label, "[dim]Listo[/dim]")
        else:
            table.add_row("❌", label, f"[yellow]Buscar:[/yellow] {keywords}")
            missing_categories.append((label, cat, keywords))

    console.print(table)

    # Si falta algo, buscar en BD
    if missing_categories:
        console.print("\n[bold yellow]Buscando recomendaciones en la BD...[/bold yellow]\n")
        for label, cat, keywords in missing_categories[:3]:  # Max 3 busquedas
            kw_list = keywords.split()[:3]
            kw_str = " ".join(kw_list)
            from scraper.db_manager import search_repos_multi_keywords

            results = search_repos_multi_keywords(kw_list, limit=3)
            if results:
                rec_table = Table(title=f"Recomendaciones para {label}")
                rec_table.add_column("Repo")
                rec_table.add_column("Estrellas", justify="right")
                rec_table.add_column("Descripcion")
                for r in results:
                    desc = clean(r.get("description"), 60)
                    rec_table.add_row(r["name"], f"{r['stars']:,}", desc)
                console.print(rec_table)
            else:
                console.print(f"[dim]{label}: No se encontraron recomendaciones en la BD[/dim]")

    console.print("\n[bold green]✅ Ready check completado[/bold green]")
    console.print("[dim]TIP: Corre 'python cli.py search <keyword>' para explorar mas[/dim]")


@app.command()
def swap(
    feature: str = typer.Argument(
        ..., help="Que estas codeando? Ej: 'pdf parser', 'auth jwt', 'http client'"
    ),
):
    """Busca si ya existe una libreria para lo que estas codeando."""
    from scraper.db_manager import search_repos_multi_keywords

    keywords = feature.strip().split()
    console.print(f"[bold]Buscando alternativas para:[/bold] {feature}\n")

    results = search_repos_multi_keywords(keywords, limit=10)

    if not results:
        console.print("[yellow]No se encontraron librerias existentes para esto.[/yellow]")
        console.print("[dim]Puede que: 1) Sea algo muy especifico, 2) No este en la BD aun[/dim]")
        console.print("[dim]Sugerencia: prueba con keywords mas genericas[/dim]")
        raise typer.Exit()

    table = Table(title=f"Alternativas para: {feature}")
    table.add_column("Libreria", style="cyan")
    table.add_column("Estrellas", justify="right", style="bold yellow")
    table.add_column("Lenguaje")
    table.add_column("Descripcion")

    for r in results[:8]:
        desc = clean(r.get("description"), 70)
        table.add_row(f"{r['owner']}/{r['name']}", f"{r['stars']:,}", r["language"] or "-", desc)

    console.print(table)

    top = results[0]
    console.print(
        f"\n[bold green]Mejor opcion:[/bold green] {top['owner']}/{top['name']} ({top['stars']:,}⭐)"
    )
    console.print(f"[dim]{top['url']}[/dim]")
    if top.get("description"):
        console.print(f"[dim]{clean(top['description'], 100)}[/dim]")
    console.print("\n[bold]Tip de instalacion:[/bold]")
    if top["language"] == "Python":
        console.print(f"  pip install {top['name']}")
    elif top["language"] in ("JavaScript", "TypeScript"):
        console.print(f"  npm install {top['name']}  # o yarn / pnpm")
    else:
        console.print(f"  Visita: {top['url']}")
    console.print(
        f"\n[dim]Mas resultados con: python cli.py search {' '.join(keywords)} --limit 20[/dim]"
    )


@app.command()
def skillify(
    repo: str = typer.Argument(
        ..., help="Repositorio a convertir en skill. Ej: 'tiangolo/fastapi'"
    ),
):
    """Convierte un repositorio en una Skill de IA (Delegado al Agente)."""
    console.print(f"[bold blue]🪄 Iniciando Meta-Skill: wheel-skillify para {repo}...[/bold blue]")
    console.print(
        Panel(
            "Esta función ahora es manejada nativamente por tu Agente de IA.\n\n"
            "[bold green]Para usarla, abre el chat de tu IA y escribe:[/bold green]\n"
            f"> [italic]wheel-skillify {repo}[/italic]",
            title="Wheel-Skillify",
            border_style="magenta",
        )
    )

import asyncio

@app.command()
def ask(
    question: str = typer.Argument(
        ..., help="Tu pregunta para la IA. Ej: 'Cual es el mejor framework de python para graficos?'"
    ),
    provider: str = typer.Option(
        None, "--provider", "-p", help="Proveedor especifico (groq, cerebras, google, mistral, etc.)"
    ),
):
    """Consulta a la IA (multi-proveedor) usando la base de datos local como contexto (RAG). Usa failover automático entre proveedores free tier."""
    console.print(f"[bold blue]Consultando a la IA sobre:[/bold blue] {question}")

    from scraper.db_manager import search_repos_multi_keywords
    keywords = [kw.strip() for kw in question.replace("?", "").replace("¿", "").split() if len(kw) > 3]
    repos = search_repos_multi_keywords(keywords, limit=10)

    if repos:
        console.print(f"[dim]Contexto encontrado: {len(repos)} repositorios.[/dim]")
    else:
        console.print("[dim]Contexto encontrado: 0 repositorios.[/dim]")

    from api.llm import ask_llm_about_repos

    with console.status("[bold green]Generando respuesta de la IA...[/bold green]"):
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        answer = loop.run_until_complete(ask_llm_about_repos(question, repos))

    console.print(Panel(answer, title="[bold magenta]WheelSaver AI[/bold magenta]", border_style="cyan"))




if __name__ == "__main__":
    # Shell completion (Typer nativo):
    #   python cli.py --install-completion  → instala autocompletado
    #   python cli.py --show-completion     → muestra script de completion
    app()
</file>

<file path="wheel-saver/scraper/__init__.py">

</file>

<file path="wheel-saver/scraper/db_manager.py">
import sqlite3
import os
import hashlib
from loguru import logger

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "top_repos.db")


def make_repo_id(owner, name):
    """
    Genera un ID sintetico consistente para repos sin GitHub node ID.
    Usa SHA-256 de 'owner/name' -> 16 chars hex.
    """
    raw = f"{owner.lower()}/{name.lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS repos (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            stars INTEGER NOT NULL,
            language TEXT,
            topics TEXT,
            updated_at TEXT,
            is_archived INTEGER DEFAULT 0
        )
    """)

    # Columnas legacy (para BDs creadas antes de que existieran)
    for col in ["is_archived"]:
        try:
            cursor.execute(f"ALTER TABLE repos ADD COLUMN {col} INTEGER DEFAULT 0")
        except Exception:
            pass

    # Crear tabla de metadatos de ejecución
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS run_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            repos_before INTEGER DEFAULT 0,
            repos_after INTEGER DEFAULT 0,
            repos_inserted INTEGER DEFAULT 0,
            repos_filtered INTEGER DEFAULT 0,
            min_stars_scanned INTEGER DEFAULT 500,
            status TEXT DEFAULT 'running'
        )
    """)

    # Índices para búsquedas rápidas (IGNORE si ya existen)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_repos_stars ON repos(stars DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_repos_language ON repos(language)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_repos_owner ON repos(owner)")

    # FTS5 para búsqueda full-text
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS repos_fts USING fts5(
            name, description, topics,
            content='repos',
            content_rowid='rowid'
        )
    """)

    conn.commit()
    return conn


def rebuild_fts():
    """Reconstruye el índice FTS5 desde los datos actuales de repos."""
    conn = init_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO repos_fts(repos_fts) VALUES('rebuild')")
        conn.commit()
        logger.info("Indice FTS5 reconstruido")
    except Exception as e:
        logger.error("Error al reconstruir indice FTS5: {}", e)
    finally:
        conn.close()


def upsert_repos(repos_list):
    """
    Inserts or updates a list of repositories in the database.
    repos_list is a list of dictionaries.
    """
    conn = init_db()
    cursor = conn.cursor()

    for repo in repos_list:
        topics_str = ",".join(repo.get("topics", []))
        cursor.execute(
            """
            INSERT INTO repos (id, name, owner, description, url, stars, language, topics, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                owner=excluded.owner,
                description=excluded.description,
                url=excluded.url,
                stars=excluded.stars,
                language=excluded.language,
                topics=excluded.topics,
                updated_at=excluded.updated_at
        """,
            (
                repo["id"],
                repo["name"],
                repo["owner"],
                repo.get("description", ""),
                repo["url"],
                repo["stars"],
                repo.get("language", ""),
                topics_str,
                repo.get("updated_at", ""),
            ),
        )

    conn.commit()

    # Sincronizar FTS después de inserts batch
    try:
        cursor.execute("INSERT INTO repos_fts(repos_fts) VALUES('rebuild')")
        conn.commit()
    except Exception:
        pass

    conn.close()


def upsert_external_repos(repos_list):
    """
    Como upsert_repos pero genera automaticamente un ID sintetico
    a partir de (owner, name) para fuentes externas que no tienen
    el GitHub node ID (EvanLi, gitstar-ranking, etc.).
    """
    for repo in repos_list:
        if "id" not in repo or not repo["id"]:
            repo["id"] = make_repo_id(repo["owner"], repo["name"])
    upsert_repos(repos_list)


def search_repos(keyword, limit=5):
    """
    Busca repos usando FTS5 (full-text search).
    Si FTS5 falla (poco probable), hace fallback a LIKE.
    """
    conn = init_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY r.stars DESC
            LIMIT ?
        """,
            (keyword, limit),
        )
    except sqlite3.OperationalError:
        # Fallback: LIKE query
        like_kw = f"%{keyword}%"
        cursor.execute(
            """
            SELECT name, owner, description, url, stars, language, topics
            FROM repos
            WHERE name LIKE ? OR description LIKE ? OR topics LIKE ?
            ORDER BY stars DESC
            LIMIT ?
        """,
            (like_kw, like_kw, like_kw, limit),
        )

    results = cursor.fetchall()
    conn.close()

    repos = []
    for r in results:
        repos.append(
            {
                "name": r[0],
                "owner": r[1],
                "description": r[2],
                "url": r[3],
                "stars": r[4],
                "language": r[5],
                "topics": r[6],
            }
        )
    return repos


def search_repos_multi_keywords(keywords, limit=20):
    """
    Busca repos que matcheen CUALQUIERA de las keywords dadas.
    Usa FTS5 con OR, fallback a LIKE.
    """
    conn = init_db()
    cursor = conn.cursor()

    try:
        fts_query = " OR ".join(keywords)
        cursor.execute(
            """
            SELECT DISTINCT r.name, r.owner, r.description, r.url, r.stars, r.language, r.topics
            FROM repos_fts f
            JOIN repos r ON r.rowid = f.rowid
            WHERE repos_fts MATCH ?
            ORDER BY r.stars DESC
            LIMIT ?
        """,
            (fts_query, limit),
        )
    except sqlite3.OperationalError:
        # Fallback: LIKE queries
        seen = set()
        cursor.execute(
            "SELECT name, owner, description, url, stars, language, topics FROM repos ORDER BY stars DESC"
        )
        all_repos = cursor.fetchall()
        results = []
        for r in all_repos:
            text = f"{r[0]} {r[1]} {r[2] or ''} {r[6] or ''}".lower()
            if any(kw.lower() in text for kw in keywords):
                if r[0] not in seen:
                    seen.add(r[0])
                    results.append(r)
                    if len(results) >= limit:
                        break

    results = cursor.fetchall() if "results" not in dir() else results
    conn.close()

    repos = []
    for r in results:
        repos.append(
            {
                "name": r[0],
                "owner": r[1],
                "description": r[2],
                "url": r[3],
                "stars": r[4],
                "language": r[5],
                "topics": r[6],
            }
        )
    return repos


def get_stats():
    """Devuelve estadísticas de la base de datos."""
    conn = init_db()
    cursor = conn.cursor()
    stats = {}
    cursor.execute("SELECT COUNT(*) FROM repos")
    stats["total_repos"] = cursor.fetchone()[0]

    cursor.execute("SELECT MIN(stars), MAX(stars), AVG(stars) FROM repos")
    row = cursor.fetchone()
    stats["stars_min"] = row[0]
    stats["stars_max"] = row[1]
    stats["stars_avg"] = round(row[2]) if row[2] else 0

    cursor.execute('SELECT COUNT(DISTINCT language) FROM repos WHERE language != ""')
    stats["languages"] = cursor.fetchone()[0]

    cursor.execute("""
        SELECT language, COUNT(*) as cnt FROM repos
        WHERE language != "" GROUP BY language ORDER BY cnt DESC LIMIT 10
    """)
    stats["top_languages"] = {r[0]: r[1] for r in cursor.fetchall()}

    conn.close()
    return stats


def get_all_repos():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute("SELECT name, description, topics, url, stars FROM repos ORDER BY stars DESC")
    results = cursor.fetchall()
    conn.close()
    return results
</file>

<file path="wheel-saver/scraper/github_fetcher.py">
import os
import sqlite3
import httpx
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from loguru import logger
from scraper.db_manager import upsert_repos, DB_PATH, init_db

load_dotenv(override=True)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# ============================================================
# UMBRAL DE CALIDAD (repos de 500-1000 estrellas)
# Se aplican filtros extra para no guardar repos desatendidos
# ============================================================
QUALITY_FILTER_THRESHOLD = 1000  # por debajo aplicamos filtros
MAX_INACTIVE_DAYS = 365  # sin commits en >1 año = desatendido


def is_active_repo(updated_at_str, stars):
    """
    Repos con +1000 estrellas: siempre se incluyen.
    Repos con 500-999 estrellas: solo si tuvieron commits en el último año.
    """
    if stars >= QUALITY_FILTER_THRESHOLD:
        return True

    try:
        updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=MAX_INACTIVE_DAYS)
        return updated_at >= cutoff_date
    except Exception:
        return False


def log_run_start():
    """Registra el inicio de una ejecución en run_history y devuelve el run_id."""
    conn = init_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM repos")
    repos_before = c.fetchone()[0]
    c.execute(
        "INSERT INTO run_history (started_at, repos_before, status) VALUES (?, ?, 'running')",
        (datetime.now(timezone.utc).isoformat(), repos_before),
    )
    run_id = c.lastrowid
    conn.commit()
    conn.close()
    return run_id, repos_before


def log_run_finish(run_id, repos_inserted, repos_filtered, min_stars, status="completed"):
    """Registra la finalización de una ejecución en run_history."""
    conn = init_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM repos")
    repos_after = c.fetchone()[0]
    c.execute(
        """UPDATE run_history
           SET finished_at = ?, repos_after = ?, repos_inserted = ?,
               repos_filtered = ?, min_stars_scanned = ?, status = ?
           WHERE id = ?""",
        (
            datetime.now(timezone.utc).isoformat(),
            repos_after,
            repos_inserted,
            repos_filtered,
            min_stars,
            status,
            run_id,
        ),
    )
    conn.commit()
    conn.close()


def fetch_top_repos(min_stars=500):
    """
    Escanea GitHub desde el Top 1 (repos con más estrellas) hacia abajo
    hasta alcanzar el umbral minimo de estrellas.

    En producción SIEMPRE empieza desde arriba para refrescar la data
    de los repos existentes (upsert), no solo agregar nuevos.
    """
    if not GITHUB_TOKEN:
        print("❌ Error: GITHUB_TOKEN no encontrado en .env")
        return

    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }

    query = """
    query($queryString: String!, $cursor: String) {
      search(query: $queryString, type: REPOSITORY, first: 100, after: $cursor) {
        pageInfo { endCursor hasNextPage }
        edges {
          node {
            ... on Repository {
              id name isArchived owner { login } description url stargazerCount
              primaryLanguage { name }
              repositoryTopics(first: 10) { nodes { topic { name } } }
              updatedAt
            }
          }
        }
      }
    }
    """

    run_id, repos_before = log_run_start()
    logger.info(
        "Iniciando escaneo desde Top 1 hasta {} estrellas (repos actuales: {})",
        min_stars,
        repos_before,
    )

    current_max_stars = 9999999  # Siempre desde el Top 1 en producción
    total_fetched = 0
    total_skipped = 0
    consecutive_errors = 0

    try:
        while current_max_stars >= min_stars:
            query_string = f"stars:<={current_max_stars} stars:>={min_stars} sort:stars-desc"
            cursor = None
            has_next_page = True
            last_repo_stars = current_max_stars

            while has_next_page:
                variables = {"queryString": query_string, "cursor": cursor}

                try:
                    with httpx.Client(timeout=httpx.Timeout(30.0, connect=15.0)) as client:
                        response = client.post(
                            url,
                            headers=headers,
                            json={"query": query, "variables": variables},
                        )
                except httpx.RequestError as e:
                    consecutive_errors += 1
                    wait = min(60, consecutive_errors * 5)
                    logger.warning("Error de conexion: {} (intento {})", e, consecutive_errors)
                    time.sleep(wait)
                    if consecutive_errors > 5:
                        logger.error("Demasiados errores consecutivos, abortando")
                        raise
                    continue

                consecutive_errors = 0  # Reset al tener éxito

                if response.status_code == 403:
                    logger.warning("Rate-limit de GitHub alcanzado. Esperando 60s...")
                    time.sleep(60)
                    continue
                elif response.status_code != 200:
                    wait = min(30, response.status_code * 2)
                    logger.warning("HTTP {} recibido. Esperando {}s...", response.status_code, wait)
                    time.sleep(wait)
                    continue

                data = response.json()
                if "errors" in data:
                    for err in data["errors"]:
                        logger.error("GraphQL error: {}", err.get("message", "desconocido"))
                    time.sleep(10)
                    continue

                search_data = data["data"]["search"]
                edges = search_data["edges"]

                if not edges:
                    break

                repos_to_insert = []
                for edge in edges:
                    node = edge["node"]
                    stars = node["stargazerCount"]
                    last_repo_stars = stars

                    # Filtro 1: Archivados
                    if node.get("isArchived", False):
                        total_skipped += 1
                        continue

                    # Filtro 2: 500-999 estrellas sin actividad reciente
                    if not is_active_repo(node["updatedAt"], stars):
                        total_skipped += 1
                        continue

                    topics = (
                        [
                            t["topic"]["name"]
                            for t in node.get("repositoryTopics", {}).get("nodes", [])
                        ]
                        if node.get("repositoryTopics")
                        else []
                    )

                    lang = node.get("primaryLanguage")
                    repos_to_insert.append(
                        {
                            "id": node["id"],
                            "name": node["name"],
                            "owner": node["owner"]["login"],
                            "description": node["description"],
                            "url": node["url"],
                            "stars": stars,
                            "language": lang.get("name", "") if lang else "",
                            "topics": topics,
                            "updated_at": node["updatedAt"],
                        }
                    )

                if repos_to_insert:
                    upsert_repos(repos_to_insert)
                    total_fetched += len(repos_to_insert)

                print(
                    f"✅ Procesados: {total_fetched:,} | "
                    f"Omitidos: {total_skipped:,} | "
                    f"Estrellas actuales: {last_repo_stars:,}"
                )

                has_next_page = search_data["pageInfo"]["hasNextPage"]
                cursor = search_data["pageInfo"]["endCursor"]
                time.sleep(0.5)  # Respetar rate-limit de GitHub

            # GitHub GraphQL devuelve max 1000 resultados por búsqueda.
            # Ajustamos el techo para la siguiente iteración.
            current_max_stars = last_repo_stars - 1

    except KeyboardInterrupt:
        logger.warning("Proceso interrumpido por el usuario")
        log_run_finish(run_id, total_fetched, total_skipped, min_stars, status="interrupted")
        return
    except Exception as e:
        logger.error("Error fatal: {}", e)
        log_run_finish(run_id, total_fetched, total_skipped, min_stars, status="failed")
        return

    log_run_finish(run_id, total_fetched, total_skipped, min_stars, status="completed")
    logger.info(
        "Escaneo completado: {} insertados, {} filtrados, {} total en BD",
        total_fetched,
        total_skipped,
        total_fetched + repos_before,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="WheelSaver Scraper — Descarga repos top de GitHub con filtros de calidad"
    )
    parser.add_argument(
        "--min-stars", type=int, default=500, help="Mínimo de estrellas (default: 500)"
    )
    args = parser.parse_args()
    fetch_top_repos(min_stars=args.min_stars)
</file>

</files>
