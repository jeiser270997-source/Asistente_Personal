import { timingSafeEqual } from 'crypto';

/**
 * Verifica el header 'x-lifeos-token' contra process.env.DASHBOARD_TOKEN
 * usando comparación de tiempo constante. Si DASHBOARD_TOKEN no está
 * configurado, deniega TODO acceso (fail-closed) y loguea una advertencia.
 */
export function isAuthorized(request: Request): boolean {
  const expected = process.env.DASHBOARD_TOKEN;
  if (!expected) {
    console.error('[auth] DASHBOARD_TOKEN no configurado — denegando acceso por defecto.');
    return false;
  }

  const provided = request.headers.get('x-lifeos-token') || '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'No autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
