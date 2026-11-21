import { errorMessage } from './api';
import { generatePanelImageVia, generateScriptVia } from './backend';
import { deleteImageFile, persistImage, persistRemoteImage } from './image-files';
import { addComic, getComic, makeId, randomSeed, updateComic, updatePanel } from './store';
import type { Comic, ComicRequest, ImageProvider, Panel, PanelImage } from './types';

// How many panels to draw at the same time for each provider.
const CONCURRENCY: Record<ImageProvider, number> = {
  pollinations: 1,
  openai: 3,
  'claude-svg': 3,
};

const runningComics = new Set<string>();
const runningPanels = new Set<string>();

export function createComic(request: ComicRequest): Comic {
  const now = Date.now();
  const comic: Comic = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    request,
    status: 'scripting',
    showSpeakers: true,
    title: '',
    synopsis: '',
    setting: '',
    characters: [],
    panels: [],
  };
  addComic(comic);
  startGeneration(comic.id);
  return comic;
}

export function isGenerating(comicId: string): boolean {
  return runningComics.has(comicId);
}

/** Starts (or resumes) script writing and panel drawing for a comic. Safe to call repeatedly. */
export function startGeneration(comicId: string) {
  if (runningComics.has(comicId)) return;
  const comic = getComic(comicId);
  if (!comic || comic.status === 'ready' || comic.status === 'error') return;
  runningComics.add(comicId);
  run(comicId).finally(() => runningComics.delete(comicId));
}

/** Retries a comic that failed while writing the script. */
export function retryComic(comicId: string) {
  const comic = getComic(comicId);
  if (!comic) return;
  updateComic(comicId, (c) => ({
    ...c,
    error: undefined,
    status: c.panels.length === 0 ? 'scripting' : 'drawing',
  }));
  startGeneration(comicId);
}

async function run(comicId: string) {
  let comic = getComic(comicId);
  if (!comic) return;

  if (comic.status === 'scripting') {
    try {
      const { script, demo } = await generateScriptVia(comic.request);
      updateComic(comicId, (c) => ({
        ...c,
        demo,
        status: 'drawing',
        title: script.title,
        synopsis: script.synopsis,
        setting: script.setting,
        characters: script.characters,
        panels: script.panels.map(
          (p): Panel => ({ ...p, id: makeId(), seed: randomSeed(), status: 'pending' })
        ),
      }));
    } catch (error) {
      updateComic(comicId, (c) => ({ ...c, status: 'error', error: errorMessage(error) }));
      return;
    }
  }

  comic = getComic(comicId);
  if (!comic) return;
  const todo = comic.panels.filter((p) => p.status !== 'done');
  await runPool(todo, CONCURRENCY[comic.request.provider], (p) => drawPanel(comicId, p.id));
  updateComic(comicId, (c) => ({ ...c, status: 'ready' }));
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, Math.min(limit, queue.length)) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

export function isPanelBusy(panelId: string): boolean {
  return runningPanels.has(panelId);
}

/** Draws (or redraws) a single panel. Errors are stored on the panel, never thrown. */
export async function drawPanel(comicId: string, panelId: string, options?: { newSeed?: boolean }) {
  if (runningPanels.has(panelId)) return;
  const comic = getComic(comicId);
  const panel = comic?.panels.find((p) => p.id === panelId);
  if (!comic || !panel) return;

  runningPanels.add(panelId);
  const seed = options?.newSeed ? randomSeed() : panel.seed;
  updatePanel(comicId, panelId, (p) => ({ ...p, seed, status: 'generating', error: undefined }));

  try {
    const { image } = await generatePanelImageVia({
      provider: comic.request.provider,
      artStyle: comic.request.artStyle,
      setting: comic.setting,
      characters: comic.characters,
      panel: {
        scene: panel.scene,
        imagePrompt: panel.imagePrompt,
        characters: panel.characters,
        wide: panel.wide,
        dialogue: panel.dialogue,
      },
      seed,
    });
    let next: PanelImage;
    if (image.kind === 'svg') next = { kind: 'svg', svg: image.svg };
    else if (image.kind === 'remote')
      next = { kind: 'uri', uri: await persistRemoteImage(comicId, panelId, image.url) };
    else next = { kind: 'uri', uri: await persistImage(comicId, panelId, image.dataUri) };
    const previous = getComic(comicId)?.panels.find((p) => p.id === panelId)?.image;
    updatePanel(comicId, panelId, (p) => ({ ...p, status: 'done', image: next, error: undefined }));
    if (previous?.kind === 'uri' && previous.uri !== (next.kind === 'uri' ? next.uri : '')) {
      deleteImageFile(previous.uri);
    }
  } catch (error) {
    updatePanel(comicId, panelId, (p) => ({ ...p, status: 'error', error: errorMessage(error) }));
  } finally {
    runningPanels.delete(panelId);
  }
}

/** Redraws every panel that failed. */
export async function redrawFailed(comicId: string) {
  const comic = getComic(comicId);
  if (!comic) return;
  const failed = comic.panels.filter((p) => p.status === 'error');
  await runPool(failed, CONCURRENCY[comic.request.provider], (p) => drawPanel(comicId, p.id));
}
