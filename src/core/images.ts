import { artStylePrompt } from '@/lib/options';
import type { PanelImageRequestBody } from '@/lib/types';

import { timeoutSignal, UserFacingError } from './errors';

// Image providers shared by the server API routes and the on-device mode.

export const DEFAULT_POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt/';
export const DEFAULT_POLLINATIONS_MODEL = 'flux';
export const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-1';

/** Builds the full text prompt sent to raster image models. */
export function buildImagePrompt(body: PanelImageRequestBody): string {
  const style = artStylePrompt(body.artStyle);
  const present = body.characters.filter((c) => body.panel.characters.includes(c.name));
  const characters = present.length
    ? ` Characters: ${present.map((c) => `${c.name} is ${c.appearance}`).join('; ')}.`
    : '';
  return (
    `${style}. Single comic book panel. ${body.panel.imagePrompt}. Setting: ${body.setting}.${characters}` +
    ' Keep the top part of the image calm for speech bubbles. No text, no letters, no words, no speech bubbles, no captions, no watermark, no border.'
  );
}

export function svgCanvasSize(wide: boolean): { width: number; height: number } {
  return wide ? { width: 1200, height: 640 } : { width: 800, height: 800 };
}

/** Pollinations generates the image when this URL is fetched (no API key needed). */
export function pollinationsUrl(
  body: PanelImageRequestBody,
  options: { baseUrl?: string; model?: string } = {}
): string {
  const params = new URLSearchParams({
    width: String(body.panel.wide ? 1280 : 768),
    height: '768',
    seed: String(body.seed),
    model: options.model || DEFAULT_POLLINATIONS_MODEL,
    nologo: 'true',
    private: 'true',
  });
  const base = options.baseUrl || DEFAULT_POLLINATIONS_BASE_URL;
  return `${base}${encodeURIComponent(buildImagePrompt(body))}?${params}`;
}

interface OpenAIImageResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

/** Generates a panel with the OpenAI Images API and returns a JPEG data URI. */
export async function openaiImage(
  body: PanelImageRequestBody,
  options: { apiKey: string; model?: string; quality?: string }
): Promise<string> {
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_OPENAI_IMAGE_MODEL,
        prompt: buildImagePrompt(body),
        size: body.panel.wide ? '1536x1024' : '1024x1024',
        quality: options.quality || 'medium',
        output_format: 'jpeg',
        output_compression: 85,
        n: 1,
      }),
      signal: timeoutSignal(180_000),
    });
  } catch (error) {
    console.error('[openai] fetch failed', error);
    throw new UserFacingError('Tidak dapat menghubungi OpenAI. Cuba lagi.', 502);
  }
  const json = (await res.json().catch(() => ({}))) as OpenAIImageResponse;
  if (!res.ok) {
    console.error('[openai] error', res.status, json.error?.message);
    if (res.status === 401) throw new UserFacingError('Kunci OpenAI tidak sah.', 401);
    if (res.status === 429)
      throw new UserFacingError('Had kadar / kredit OpenAI habis. Cuba lagi nanti.', 429);
    if (res.status === 400) {
      throw new UserFacingError('OpenAI menolak gambar untuk panel ini. Cuba ubah penerangan panel.', 422);
    }
    throw new UserFacingError(`OpenAI gagal menjana gambar (status ${res.status}).`, 502);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new UserFacingError('OpenAI tidak memulangkan gambar.', 502);
  return `data:image/jpeg;base64,${b64}`;
}
