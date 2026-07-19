import os
import aiosqlite
import time
import logging

# ── Cache con TTL ────────────────────────────────────────────────────────────
_CACHE_TTL_SECONDS = int(os.environ.get("WHEELSAVER_CACHE_TTL", "300"))  # 5 min default

_cache = {}  # {key: (timestamp, result)}

def _cached(key: str, ttl: int | None = None):
    """Obtiene del cache si existe y no ha expirado."""
    if key in _cache:
        ts, result = _cache[key]
        if time.time() - ts < (ttl or _CACHE_TTL_SECONDS):
            return result
    return None

def _set_cache(key: str, result):
    """Guarda en cache con timestamp."""
    _cache[key] = (time.time(), result)

async def _invalidate_cache():
    """Invalida todo el cache. Llamar después de trigger_scrape."""
    _cache.clear()


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

    fts_query_and = " AND ".join(f'"{kw.replace(chr(34), "")}"' for kw in keywords)

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

            fts_query_or = " OR ".join(f'"{kw.replace(chr(34), "")}"' for kw in keywords)
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


async def get_stats_async(db: aiosqlite.Connection):
    """Estadísticas con cache TTL."""
    cached = _cached("get_stats")
    if cached is not None:
        return cached

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

    _set_cache("get_stats", stats)
    return stats


async def get_repo_async(db: aiosqlite.Connection, owner: str, name: str):
    cursor = await db.execute(
        "SELECT * FROM repos WHERE owner = ? AND name = ?",
        (owner, name),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def get_languages_async(db: aiosqlite.Connection, min_repos: int, limit: int):
    """Lenguajes con cache TTL."""
    cache_key = f"get_languages_{min_repos}_{limit}"
    cached = _cached(cache_key)
    if cached is not None:
        return cached

    cursor = await db.execute(
        """SELECT language, COUNT(*) as count FROM repos
           WHERE language != '' GROUP BY language
           HAVING count >= ? ORDER BY count DESC LIMIT ?""",
        (min_repos, limit),
    )
    langs = await cursor.fetchall()
    result = [{"language": r["language"], "repos": r["count"]} for r in langs]

    _set_cache(cache_key, result)
    return result


async def list_repos_async(
    db: aiosqlite.Connection, order_col: str, language: str, per_page: int, offset: int
):
    # Guardrail contra Inyección SQL por interpolación (FIX-006)
    allowed_cols = {"stars", "name", "updated_at", "language", "owner"}
    if order_col not in allowed_cols:
        raise ValueError(f"Columna de ordenación no válida: {order_col}")

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
