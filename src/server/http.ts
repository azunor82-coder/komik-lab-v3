import { describeError, UserFacingError } from '@/core/errors';

export { UserFacingError };

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Converts any thrown error into a JSON response with a Malay message. */
export function errorResponse(error: unknown): Response {
  const { message, status } = describeError(error);
  return jsonError(message, status);
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
