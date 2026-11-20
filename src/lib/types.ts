// Shared types used by both the app (client) and the API routes (server).
// Keep this file free of imports from react-native or server-only packages.

export type Language = 'ms' | 'en';

export type ImageProvider = 'pollinations' | 'openai' | 'claude-svg';

export type BubbleKind = 'speech' | 'thought' | 'shout' | 'whisper';

export type BubblePosition = 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';

export interface Character {
  name: string;
  /** Visual description in English, reused in every image prompt for consistency. */
  appearance: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  kind: BubbleKind;
  position: BubblePosition;
}

export interface PanelScript {
  /** What happens in the panel, written in the comic's language (shown in the editor). */
  scene: string;
  /** Visual-only description in English for the image generator. */
  imagePrompt: string;
  /** Names of characters visible in the panel. */
  characters: string[];
  /** Wide panels take a full row on the page. */
  wide: boolean;
  caption: string | null;
  sfx: string | null;
  dialogue: DialogueLine[];
}

export interface ComicScript {
  title: string;
  synopsis: string;
  setting: string;
  characters: Character[];
  panels: PanelScript[];
}

export type PanelImage = { kind: 'uri'; uri: string } | { kind: 'svg'; svg: string };

export type PanelStatus = 'pending' | 'generating' | 'done' | 'error';

export interface Panel extends PanelScript {
  id: string;
  seed: number;
  status: PanelStatus;
  image?: PanelImage;
  error?: string;
}

export interface ComicRequest {
  idea: string;
  genre: string;
  artStyle: string;
  panelCount: number;
  language: Language;
  provider: ImageProvider;
}

export type ComicStatus = 'scripting' | 'drawing' | 'ready' | 'error';

export interface Comic {
  id: string;
  createdAt: number;
  updatedAt: number;
  request: ComicRequest;
  status: ComicStatus;
  error?: string;
  /** True when the script came from the built-in demo generator (no API key on the server). */
  demo?: boolean;
  showSpeakers: boolean;
  title: string;
  synopsis: string;
  setting: string;
  characters: Character[];
  panels: Panel[];
}

// ---- API payloads ----

export type ScriptRequestBody = ComicRequest;

export interface ScriptResponseBody {
  script: ComicScript;
  demo: boolean;
}

export interface PanelImageRequestBody {
  provider: ImageProvider;
  artStyle: string;
  setting: string;
  characters: Character[];
  panel: Pick<PanelScript, 'scene' | 'imagePrompt' | 'characters' | 'wide' | 'dialogue'>;
  seed: number;
}

export type PanelImageResult = { kind: 'data'; dataUri: string } | { kind: 'svg'; svg: string };

export interface PanelImageResponseBody {
  image: PanelImageResult;
  demo: boolean;
}

export interface StatusResponseBody {
  anthropic: boolean;
  openai: boolean;
  pollinations: boolean;
  demo: boolean;
  model: string;
}

export interface ApiErrorBody {
  error: string;
}
