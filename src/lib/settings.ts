import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { getSecret, setSecret } from './secret-storage';

// API keys the user typed into the Settings screen. They never leave the phone
// except in requests to Anthropic / OpenAI themselves.

export interface Settings {
  anthropicKey: string | null;
  openaiKey: string | null;
}

const KEYS = {
  anthropicKey: 'komiklab.anthropicKey',
  openaiKey: 'komiklab.openaiKey',
} as const;

let settings: Settings = { anthropicKey: null, openaiKey: null };
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function loadSettings(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
  loading ??= Promise.all([getSecret(KEYS.anthropicKey), getSecret(KEYS.openaiKey)])
    .then(([anthropicKey, openaiKey]) => {
      settings = { anthropicKey, openaiKey };
    })
    .catch((error) => console.warn('[settings] gagal membaca kunci', error))
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

export const getSettings = (): Settings => settings;
export const settingsLoaded = (): boolean => loaded;

export async function saveSetting(name: keyof Settings, value: string | null): Promise<void> {
  const clean = value?.trim() || null;
  await setSecret(KEYS[name], clean);
  settings = { ...settings, [name]: clean };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

export function useSettingsLoaded(): boolean {
  return useSyncExternalStore(subscribe, settingsLoaded, settingsLoaded);
}

/** Shows only the start and end of a key, e.g. "sk-ant-…x9Qa". */
export function maskKey(key: string): string {
  if (key.length <= 12) return '•'.repeat(key.length);
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}
