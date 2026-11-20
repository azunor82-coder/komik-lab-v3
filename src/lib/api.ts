import type {
  ApiErrorBody,
  ComicRequest,
  PanelImageRequestBody,
  PanelImageResponseBody,
  ScriptResponseBody,
  StatusResponseBody,
} from './types';

// In development Expo Router serves the API routes from the dev server and
// relative URLs just work. For production builds either set the expo-router
// plugin `origin` in app.json or EXPO_PUBLIC_API_URL to the deployed server.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(APP_TOKEN ? { 'x-komik-token': APP_TOKEN } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Tidak dapat menghubungi pelayan Komik Lab. Semak sambungan internet anda.');
  }
  const json = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok || !json) {
    throw new Error(json?.error ?? `Ralat pelayan (${res.status}).`);
  }
  return json;
}

export const api = {
  status: () => request<StatusResponseBody>('/api/status'),
  script: (body: ComicRequest) =>
    request<ScriptResponseBody>('/api/script', { method: 'POST', body: JSON.stringify(body) }),
  panelImage: (body: PanelImageRequestBody) =>
    request<PanelImageResponseBody>('/api/panel-image', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
