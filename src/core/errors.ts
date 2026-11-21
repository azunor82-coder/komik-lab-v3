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

/** Converts any thrown error into a Malay message plus an HTTP-style status. */
export function describeError(error: unknown): { message: string; status: number } {
  if (error instanceof UserFacingError) {
    return { message: error.message, status: error.status };
  }
  // Most specific Anthropic errors first.
  if (error instanceof Anthropic.AuthenticationError) {
    return { message: 'Kunci API Anthropic tidak sah. Semak kunci anda.', status: 401 };
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return { message: 'Akaun Anthropic tiada kebenaran untuk model ini.', status: 403 };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { message: 'Terlalu banyak permintaan ke Claude. Cuba lagi sebentar.', status: 429 };
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error('[anthropic] bad request', error.message);
    return {
      message: 'Permintaan ke Claude ditolak. Semak kredit akaun atau cuba ubah idea anda.',
      status: 400,
    };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { message: 'Tidak dapat menghubungi Claude. Semak sambungan internet anda.', status: 502 };
  }
  if (error instanceof Anthropic.APIError) {
    console.error('[anthropic] api error', error.status, error.message);
    return { message: 'Pelayan Claude sedang bermasalah. Cuba lagi nanti.', status: 502 };
  }
  console.error('[komik-lab] unexpected error', error);
  return { message: 'Ralat yang tidak dijangka.', status: 500 };
}

/** AbortSignal that fires after `ms` (AbortSignal.timeout is not available everywhere). */
export function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
