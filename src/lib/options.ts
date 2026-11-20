import type { ImageProvider, Language } from './types';

export interface Option<T extends string = string> {
  id: T;
  label: string;
  emoji: string;
}

export interface ArtStyleOption extends Option {
  /** English style description appended to every image prompt. */
  prompt: string;
}

export const GENRES: Option[] = [
  { id: 'comedy', label: 'Komedi', emoji: '😂' },
  { id: 'action', label: 'Aksi', emoji: '💥' },
  { id: 'fantasy', label: 'Fantasi', emoji: '🐉' },
  { id: 'scifi', label: 'Sains Fiksyen', emoji: '🚀' },
  { id: 'mystery', label: 'Misteri', emoji: '🔎' },
  { id: 'spooky', label: 'Seram Ringan', emoji: '👻' },
  { id: 'romance', label: 'Romantik', emoji: '💕' },
  { id: 'slice-of-life', label: 'Kehidupan Harian', emoji: '☕' },
  { id: 'kids', label: 'Kanak-kanak', emoji: '🧸' },
  { id: 'educational', label: 'Pendidikan', emoji: '📚' },
];

export const ART_STYLES: ArtStyleOption[] = [
  {
    id: 'cartoon',
    label: 'Kartun',
    emoji: '🎨',
    prompt: 'colorful cartoon comic style, thick clean black outlines, flat vibrant colors, expressive faces',
  },
  {
    id: 'manga',
    label: 'Manga',
    emoji: '🗾',
    prompt: 'black and white manga style, detailed ink line art, screentone shading, dynamic composition',
  },
  {
    id: 'superhero',
    label: 'Komik Amerika',
    emoji: '🦸',
    prompt:
      'classic american comic book style, bold inks, vibrant colors, halftone dot shading, dramatic lighting',
  },
  {
    id: 'webtoon',
    label: 'Webtoon',
    emoji: '📱',
    prompt: 'modern webtoon style, clean digital line art, soft cel shading, pastel color palette',
  },
  {
    id: 'watercolor',
    label: 'Cat Air',
    emoji: '🖌️',
    prompt: 'storybook watercolor illustration, soft color washes, delicate ink outlines, warm paper texture',
  },
  {
    id: 'noir',
    label: 'Noir',
    emoji: '🕵️',
    prompt: 'film noir comic style, high contrast black and white, heavy shadows, dramatic angles',
  },
  {
    id: 'retro',
    label: 'Retro 60-an',
    emoji: '📻',
    prompt: 'retro 1960s comic style, ben-day dots, limited bright palette, vintage printed paper look',
  },
  {
    id: '3d',
    label: 'Animasi 3D',
    emoji: '🧊',
    prompt: '3D animated film style, soft global illumination, rounded expressive characters, rich colors',
  },
];

export const PANEL_COUNTS = [4, 6, 8] as const;

export const LANGUAGES: Option<Language>[] = [
  { id: 'ms', label: 'Bahasa Melayu', emoji: '🇲🇾' },
  { id: 'en', label: 'English', emoji: '🇬🇧' },
];

export interface ProviderOption extends Option<ImageProvider> {
  description: string;
}

export const PROVIDERS: ProviderOption[] = [
  {
    id: 'pollinations',
    label: 'Pollinations',
    emoji: '🌼',
    description: 'Percuma, tiada kunci API. Kadang-kadang perlahan.',
  },
  {
    id: 'openai',
    label: 'OpenAI Image',
    emoji: '🖼️',
    description: 'Kualiti tinggi. Perlu OPENAI_API_KEY (berbayar).',
  },
  {
    id: 'claude-svg',
    label: 'Claude Lukis SVG',
    emoji: '✏️',
    description: 'Gaya vektor ringkas, watak lebih konsisten. Guna kunci Anthropic.',
  },
];

export const SAMPLE_IDEAS: Record<Language, string[]> = {
  ms: [
    'Seekor kucing oren bernama Comel cuba mencuri ikan goreng dari dapur Mak Cik Timah, tetapi rancangannya asyik gagal.',
    'Dua sahabat sekolah menemui robot lama di stor sekolah yang hanya boleh bercakap dalam pantun.',
    'Seorang budak penghantar makanan sebenarnya adalah wira super yang perlu menghantar nasi lemak sebelum ia sejuk.',
    'Atuk yang baru belajar guna telefon pintar secara tak sengaja menjadi viral di media sosial.',
    'Pasukan bola sepak kampung menentang pasukan alien untuk menyelamatkan bumi.',
    'Seorang ahli sihir muda di Melaka tersilap jampi dan menukar durian menjadi naga kecil.',
  ],
  en: [
    'An orange cat named Biscuit tries to steal fried fish from the kitchen, but every plan backfires.',
    'Two school friends find an old robot in the storeroom that can only speak in rhymes.',
    'A food delivery rider is secretly a superhero who must deliver noodles before they get cold.',
    'Grandpa learns to use a smartphone and accidentally goes viral.',
    'A village football team must beat an alien team to save the planet.',
    'A young wizard casts the wrong spell and turns a durian into a tiny dragon.',
  ],
};

export function findLabel(list: Option[], id: string): string {
  return list.find((o) => o.id === id)?.label ?? id;
}

export function artStylePrompt(id: string): string {
  return ART_STYLES.find((s) => s.id === id)?.prompt ?? ART_STYLES[0].prompt;
}
