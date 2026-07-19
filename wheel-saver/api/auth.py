"""
WheelSaver Auth — Middleware de autenticación para la API.

Patrón fail-closed: si WHEELSAVER_TOKEN no está configurado, deniega todo.
Misma estrategia que dashboard/src/lib/auth.ts (comparación en tiempo constante).

Uso:
    from api.auth import require_auth, AuthError
    @app.post("/scrape")
    async def scrape(token: str = Depends(require_auth)):
        ...
"""

import os
import hmac
from fastapi import HTTPException, Header
from typing import Annotated

AUTH_TOKEN = os.environ.get("WHEELSAVER_TOKEN", "")


class AuthError(HTTPException):
    def __init__(self):
        super().__init__(status_code=401, detail="No autorizado")


async def require_auth(authorization: Annotated[str | None, Header(alias="x-wheelsaver-token")] = None) -> str:
    """Dependency que verifica el token. Fail-closed: sin token configurado → 401."""
    if not AUTH_TOKEN:
        print("[auth] WHEELSAVER_TOKEN no configurado — denegando acceso por defecto.")
        raise AuthError()

    provided = (authorization or "").strip()
    if not provided:
        raise AuthError()

    # Comparación en tiempo constante para evitar timing attacks
    if not hmac.compare_digest(AUTH_TOKEN, provided):
        raise AuthError()

    return provided



