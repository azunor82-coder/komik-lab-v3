import Anthropic from '@anthropic-ai/sdk';
import { Platform } from 'react-native';

import { DEFAULT_CLAUDE_MODEL, drawPanelSvg, generateScript } from '@/core/claude';
import { demoPanelSvg, demoScript } from '@/core/demo';
import { describeError, UserFacingError } from '@/core/errors';
import { openaiImage, pollinationsUrl, svgCanvasSize } from '@/core/images';
import { normalizeScript } from '@/core/normalize';

import { artStylePrompt } from './options';
import type { Settings } from './settings';
import type {
  ComicRequest,
  PanelImageRequestBody,
  PanelImageResponseBody,
  PanelImageResult,
  ScriptResponseBody,
} from './types';

// On-device mode: the phone talks to Anthropic / OpenAI / Pollinations directly
// using the keys saved in Settings, so no server is needed.

let cached: { key: string; client: Anthropic } | null = null;

function anthropic(apiKey: string): Anthropic {
  if (cached?.key !== apiKey) {
    cached = {
      key: apiKey,
      client: new Anthropic({
        apiKey,
        // The web preview runs in a browser; the user is using their own key there.
        dangerouslyAllowBrowser: Platform.OS === 'web',
        timeout: 5 * 60_000,
      }),
    };
  }
  return cached.client;
}

async function friendly<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw new Error(describeError(error).message);
  }
}

export function localScript(req: ComicRequest, settings: Settings): Promise<ScriptResponseBody> {
  return friendly(async () => {
    if (!settings.anthropicKey) {
      return { script: normalizeScript(demoScript(req), req.panelCount), demo: true };
    }
    const raw = await generateScript(anthropic(settings.anthropicKey), DEFAULT_CLAUDE_MODEL, req);
    return { script: normalizeScript(raw, req.panelCount), demo: false };
  });
}

export function localPanelImage(
  body: PanelImageRequestBody,
  settings: Settings
): Promise<PanelImageResponseBody> {
  return friendly(async () => {
    let image: PanelImageResult;
    let demo = false;
    switch (body.provider) {
      case 'pollinations':
        image = { kind: 'remote', url: pollinationsUrl(body) };
        break;
      case 'openai':
        if (!settings.openaiKey) {
          throw new UserFacingError('Masukkan kunci OpenAI dalam Tetapan, atau pilih penjana lain.');
        }
        image = { kind: 'data', dataUri: await openaiImage(body, { apiKey: settings.openaiKey }) };
        break;
      case 'claude-svg': {
        const size = svgCanvasSize(body.panel.wide);
        if (!settings.anthropicKey) {
          image = { kind: 'svg', svg: demoPanelSvg(body, size) };
          demo = true;
        } else {
          const svg = await drawPanelSvg(
            anthropic(settings.anthropicKey),
            DEFAULT_CLAUDE_MODEL,
            body,
            artStylePrompt(body.artStyle),
            size
          );
          image = { kind: 'svg', svg };
        }
        break;
      }
      default:
        throw new UserFacingError('Penjana gambar tidak dikenali.');
    }
    return { image, demo };
  });
}

/** Checks a key with a cheap Models API call (no tokens are used). */
export function testAnthropicKey(apiKey: string): Promise<void> {
  return friendly(async () => {
    await anthropic(apiKey).models.retrieve(DEFAULT_CLAUDE_MODEL);
  });
}
