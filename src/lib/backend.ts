import { useEffect, useState } from 'react';

import { api, errorMessage } from './api';
import { localPanelImage, localScript } from './local-backend';
import { getSettings, useSettings, type Settings } from './settings';
import type {
  ComicRequest,
  PanelImageRequestBody,
  PanelImageResponseBody,
  ScriptResponseBody,
  StatusResponseBody,
} from './types';

/**
 * Where comics are generated:
 * - device: the user's own API key saved in Settings (works in the installed app, no server)
 * - server: Expo API routes (development, or a deployed server via EXPO_PUBLIC_API_URL)
 * - demo:   no key and no server — built-in sample story and drawings
 */
export type BackendMode = 'device' | 'server' | 'demo';

const SERVER_CONFIGURED = Boolean(process.env.EXPO_PUBLIC_API_URL) || __DEV__;

export function backendMode(settings: Settings = getSettings()): BackendMode {
  if (settings.anthropicKey) return 'device';
  if (SERVER_CONFIGURED) return 'server';
  return 'demo';
}

export function generateScriptVia(req: ComicRequest): Promise<ScriptResponseBody> {
  const settings = getSettings();
  return backendMode(settings) === 'server' ? api.script(req) : localScript(req, settings);
}

export function generatePanelImageVia(body: PanelImageRequestBody): Promise<PanelImageResponseBody> {
  const settings = getSettings();
  return backendMode(settings) === 'server' ? api.panelImage(body) : localPanelImage(body, settings);
}

export interface BackendStatus {
  mode: BackendMode;
  /** Comics will use the sample story instead of Claude. */
  demo: boolean;
  /** The OpenAI image provider can be used. */
  openai: boolean;
}

let cachedServer: StatusResponseBody | null = null;

/** What the current backend can do; asks the server only in server mode. */
export function useBackendStatus(): { status: BackendStatus | null; error: string | null } {
  const settings = useSettings();
  const mode = backendMode(settings);
  const [server, setServer] = useState<StatusResponseBody | null>(cachedServer);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'server') return;
    let active = true;
    api.status().then(
      (next) => {
        cachedServer = next;
        if (!active) return;
        setServer(next);
        setError(null);
      },
      (e: unknown) => {
        if (active) setError(errorMessage(e));
      }
    );
    return () => {
      active = false;
    };
  }, [mode]);

  if (mode === 'server') {
    return {
      status: server ? { mode, demo: server.demo, openai: server.openai } : null,
      error,
    };
  }
  return {
    status: { mode, demo: mode === 'demo', openai: Boolean(settings.openaiKey) },
    error: null,
  };
}
