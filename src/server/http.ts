import Anthropic from '@anthropic-ai/sdk';

/** An error whose message is safe to show to the app user. */
export class UserFacingError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Converts any thrown error into a JSON response with a Malay message. */
export function errorResponse(error: unknown): Response {
  if (error instanceof UserFacingError) {
    return jsonError(error.message, error.status);
  }
  // Most specific Anthropic errors first.
  if (error instanceof Anthropic.AuthenticationError) {
    return jsonError('Kunci API Anthropic tidak sah. Semak ANTHROPIC_API_KEY di pelayan.', 401);
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return jsonError('Akaun Anthropic tiada kebenaran untuk model ini.', 403);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return jsonError('Terlalu banyak permintaan ke Claude. Cuba lagi sebentar.', 429);
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error('[anthropic] bad request', error.message);
    return jsonError('Permintaan ke Claude ditolak. Cuba ubah idea anda.', 400);
  }
  if (error instanceof Anthropic.APIError) {
    console.error('[anthropic] api error', error.status, error.message);
    return jsonError('Pelayan Claude sedang bermasalah. Cuba lagi nanti.', 502);
  }
  console.error('[api] unexpected error', error);
  return jsonError('Ralat pelayan yang tidak dijangka.', 500);
}

/**
 * Optional shared secret so a public deployment can't be used by strangers to
 * spend your API credits. Set APP_ACCESS_TOKEN on the server and the same value
 * as EXPO_PUBLIC_APP_TOKEN when building the app.
 */
export function checkAccess(request: Request) {
  const expected = process.env.APP_ACCESS_TOKEN;
  if (!expected) return;
  if (request.headers.get('x-komik-token') !== expected) {
    throw new UserFacingError('Akses ditolak: token aplikasi tidak sah.', 401);
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new UserFacingError('Badan permintaan bukan JSON yang sah.', 400);
  }
}
