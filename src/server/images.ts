import { artStylePrompt } from '@/lib/options';
import type { PanelImageRequestBody, PanelImageResult } from '@/lib/types';

import { drawPanelSvg } from './claude';
import {
  OPENAI_IMAGE_MODEL,
  POLLINATIONS_BASE_URL,
  POLLINATIONS_MODEL,
  hasOpenAIKey,
  isDemoMode,
} from './config';
import { demoPanelSvg } from './demo';
import { UserFacingError } from './http';

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

function bufferToDataUri(buffer: ArrayBuffer, contentType: string): string {
  return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
}

async function pollinations(body: PanelImageRequestBody): Promise<PanelImageResult> {
  const prompt = buildImagePrompt(body);
  const width = body.panel.wide ? 1280 : 768;
  const height = 768;
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(body.seed),
    model: POLLINATIONS_MODEL,
    nologo: 'true',
    private: 'true',
  });
  const url = `${POLLINATIONS_BASE_URL}${encodeURIComponent(prompt)}?${params}`;
  const headers: Record<string, string> = {};
  if (process.env.POLLINATIONS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
  } catch (error) {
    console.error('[pollinations] fetch failed', error);
    throw new UserFacingError(
      'Tidak dapat menghubungi Pollinations. Cuba lagi atau tukar penjana gambar.',
      502
    );
  }
  if (res.status === 429) {
    throw new UserFacingError('Pollinations sedang sibuk (had kadar). Tunggu sebentar dan jana semula.', 429);
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok || !contentType.startsWith('image/')) {
    console.error('[pollinations] bad response', res.status, contentType);
    throw new UserFacingError(`Pollinations gagal menjana gambar (status ${res.status}).`, 502);
  }
  return { kind: 'data', dataUri: bufferToDataUri(await res.arrayBuffer(), contentType) };
}

interface OpenAIImageResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

async function openai(body: PanelImageRequestBody): Promise<PanelImageResult> {
  if (!hasOpenAIKey()) {
    throw new UserFacingError('OPENAI_API_KEY belum ditetapkan di pelayan. Pilih penjana lain.', 400);
  }
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: buildImagePrompt(body),
        size: body.panel.wide ? '1536x1024' : '1024x1024',
        quality: process.env.OPENAI_IMAGE_QUALITY || 'medium',
        output_format: 'jpeg',
        output_compression: 85,
        n: 1,
      }),
      signal: AbortSignal.timeout(180_000),
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
  return { kind: 'data', dataUri: `data:image/jpeg;base64,${b64}` };
}

export function svgCanvasSize(wide: boolean): { width: number; height: number } {
  return wide ? { width: 1200, height: 640 } : { width: 800, height: 800 };
}

async function claudeSvg(body: PanelImageRequestBody): Promise<PanelImageResult> {
  const size = svgCanvasSize(body.panel.wide);
  if (isDemoMode()) {
    return { kind: 'svg', svg: demoPanelSvg(body, size) };
  }
  const svg = await drawPanelSvg(body, artStylePrompt(body.artStyle), size);
  return { kind: 'svg', svg };
}

export async function generatePanelImage(body: PanelImageRequestBody): Promise<PanelImageResult> {
  switch (body.provider) {
    case 'pollinations':
      return pollinations(body);
    case 'openai':
      return openai(body);
    case 'claude-svg':
      return claudeSvg(body);
    default:
      throw new UserFacingError('Penjana gambar tidak dikenali.', 400);
  }
}
