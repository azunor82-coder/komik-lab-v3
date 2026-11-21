import { drawPanelSvg } from '@/core/claude';
import { demoPanelSvg } from '@/core/demo';
import { timeoutSignal, UserFacingError } from '@/core/errors';
import { openaiImage, pollinationsUrl, svgCanvasSize } from '@/core/images';
import { artStylePrompt } from '@/lib/options';
import type { PanelImageRequestBody, PanelImageResult } from '@/lib/types';

import { getAnthropic } from './anthropic';
import {
  CLAUDE_MODEL,
  OPENAI_IMAGE_MODEL,
  POLLINATIONS_BASE_URL,
  POLLINATIONS_MODEL,
  hasOpenAIKey,
  isDemoMode,
} from './config';

function bufferToDataUri(buffer: ArrayBuffer, contentType: string): string {
  return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
}

/** Server mode fetches the Pollinations image itself so the app gets a ready image. */
async function pollinations(body: PanelImageRequestBody): Promise<PanelImageResult> {
  const url = pollinationsUrl(body, { baseUrl: POLLINATIONS_BASE_URL, model: POLLINATIONS_MODEL });
  const headers: Record<string, string> = {};
  if (process.env.POLLINATIONS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { headers, signal: timeoutSignal(120_000) });
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

async function openai(body: PanelImageRequestBody): Promise<PanelImageResult> {
  if (!hasOpenAIKey()) {
    throw new UserFacingError('OPENAI_API_KEY belum ditetapkan di pelayan. Pilih penjana lain.', 400);
  }
  const dataUri = await openaiImage(body, {
    apiKey: process.env.OPENAI_API_KEY!,
    model: OPENAI_IMAGE_MODEL,
    quality: process.env.OPENAI_IMAGE_QUALITY,
  });
  return { kind: 'data', dataUri };
}

async function claudeSvg(body: PanelImageRequestBody): Promise<PanelImageResult> {
  const size = svgCanvasSize(body.panel.wide);
  if (isDemoMode()) {
    return { kind: 'svg', svg: demoPanelSvg(body, size) };
  }
  const svg = await drawPanelSvg(getAnthropic(), CLAUDE_MODEL, body, artStylePrompt(body.artStyle), size);
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
