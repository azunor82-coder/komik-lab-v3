import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { Comic, Panel } from './types';

// A tiny external store for the comic library, persisted to AsyncStorage.
// Generation code runs outside React and updates comics through this store,
// so it keeps going when the user navigates between screens.

const STORAGE_KEY = 'komiklab:comics:v1';

let comics: Comic[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(comics)).catch((error) => {
      console.warn('[store] gagal menyimpan komik', error);
    });
  }, 250);
}

/** Panels that were mid-generation when the app closed. */
function recoverInterrupted(comic: Comic): Comic {
  if (!comic.panels.some((p) => p.status === 'generating')) return comic;
  return {
    ...comic,
    panels: comic.panels.map((p): Panel => {
      if (p.status !== 'generating') return p;
      // Comics still drawing will pick these up again automatically.
      return comic.status === 'drawing'
        ? { ...p, status: 'pending' }
        : { ...p, status: 'error', error: 'Terganggu. Ketik panel untuk jana semula.' };
    }),
  };
}

export function loadComics(): Promise<void> {
  if (loaded) return Promise.resolve();
  // Web server rendering: there is no device storage on the server.
  if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      const parsed = (raw ? (JSON.parse(raw) as Comic[]) : []).map(recoverInterrupted);
      // Keep anything created in this session before the load finished.
      const known = new Set(comics.map((c) => c.id));
      comics = [...comics, ...parsed.filter((c) => !known.has(c.id))];
    })
    .catch((error) => {
      console.warn('[store] gagal membaca komik', error);
    })
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getComics = (): Comic[] => comics;
export const isLoaded = (): boolean => loaded;
export const getComic = (id: string): Comic | undefined => comics.find((c) => c.id === id);

export function addComic(comic: Comic) {
  comics = [comic, ...comics];
  emit();
  persist();
}

export function updateComic(id: string, update: (comic: Comic) => Comic) {
  let changed = false;
  comics = comics.map((c) => {
    if (c.id !== id) return c;
    changed = true;
    return { ...update(c), updatedAt: Date.now() };
  });
  if (changed) {
    emit();
    persist();
  }
}

export function updatePanel(comicId: string, panelId: string, update: (panel: Panel) => Panel) {
  updateComic(comicId, (c) => ({
    ...c,
    panels: c.panels.map((p) => (p.id === panelId ? update(p) : p)),
  }));
}

export function removeComic(id: string) {
  comics = comics.filter((c) => c.id !== id);
  emit();
  persist();
}

// ---- React hooks ----

export function useComics(): Comic[] {
  return useSyncExternalStore(subscribe, getComics, getComics);
}

export function useComic(id: string): Comic | undefined {
  const get = () => getComic(id);
  return useSyncExternalStore(subscribe, get, get);
}

export function useStoreLoaded(): boolean {
  return useSyncExternalStore(subscribe, isLoaded, isLoaded);
}

export function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}
