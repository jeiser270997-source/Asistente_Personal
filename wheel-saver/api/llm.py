"""
WheelSaver LLM — Cliente simplificado con proxy LiteLLM y fallback directo.
"""

import os
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

LITELLM_URL = os.getenv("LITELLM_URL", "http://localhost:4000")


async def _probe_litellm(timeout: float = 1.0) -> bool:
    """Verifica si el proxy de LiteLLM está respondiendo localmente."""
    if os.getenv("GITHUB_ACTIONS"):
        return False
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(f"{LITELLM_URL}/health/liveliness")
            return resp.status_code == 200
    except Exception:
        return False


async def _get_client() -> tuple[AsyncOpenAI, str]:
    """
    Inicializa el cliente de OpenAI.
    Retorna una tupla (AsyncOpenAI, modelo_a_usar).
    """
    if await _probe_litellm():
        client = AsyncOpenAI(
            api_key="litellm-proxy",
            base_url=f"{LITELLM_URL}/v1"
        )
        return client, "smart-router"

    # Fallback directo si el proxy está apagado (ej. en local sin Docker)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        client = AsyncOpenAI(
            api_key=openrouter_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/jeiser-dev/lifeos",
                "X-Title": "LifeOS"
            }
        )
        return client, "google/gemini-2.5-flash"

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        client = AsyncOpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1"
        )
        return client, "llama-3.3-70b-versatile"

    raise RuntimeError(
        "No hay proxy de LiteLLM activo ni claves de API para fallback directo (OPENROUTER_API_KEY, GROQ_API_KEY)"
    )


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


async def ask_llm(system_prompt: str = "", user_prompt: str = "", **kwargs) -> str:
    """
    Consulta al LLM unificado usando el cliente activo (LiteLLM o fallback).
    Incluye 3 reintentos con backoff exponencial (2s, 4s) para rate limits transitorios.
    """
    import asyncio

    try:
        client, model = await _get_client()
    except RuntimeError as e:
        raise RuntimeError(f"Error de inicialización de LLM: {e}")

    last_error = None
    for attempt in range(1, 4):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=kwargs.get("max_tokens", 800),
                temperature=kwargs.get("temperature", 0.3),
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)

    raise RuntimeError(f"LLM falló tras 3 intentos: {last_error}")


async def ask_llm_about_repos(question: str, repos: list[dict], **kwargs) -> str:
    """
    Toma una pregunta del usuario y una lista de repositorios,
    y usa el LLM unificado para responder.
    """
    system_prompt, user_prompt = _build_prompts(question, repos)

    try:
        return await ask_llm(system_prompt=system_prompt, user_prompt=user_prompt, **kwargs)
    except Exception as e:
        return f"Error al generar respuesta: {e}"


# Alias backwards-compatible
ask_deepseek_about_repos = ask_llm_about_repos
