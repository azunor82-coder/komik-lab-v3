// Demo mode: lets the app run end-to-end without any API keys.
// The script is a fixed template and the panels are simple procedural SVGs.

import type { ComicRequest, PanelImageRequestBody } from '@/lib/types';

import type { ComicScriptOutput } from './schema';

type DemoPanel = ComicScriptOutput['panels'][number];

function shortIdea(idea: string, words = 6): string {
  const list = idea.trim().split(/\s+/).slice(0, words).join(' ');
  return list.length > 0 ? list : 'Hari Yang Luar Biasa';
}

const CHARACTERS: ComicScriptOutput['characters'] = [
  {
    name: 'Ali',
    appearance:
      '10-year-old Malaysian boy, short black spiky hair, warm brown skin, red t-shirt, blue shorts, white sneakers, yellow backpack',
  },
  {
    name: 'Comel',
    appearance: 'chubby orange tabby cat with white paws, big green eyes and a small blue collar with a bell',
  },
];

function panelsMs(idea: string): DemoPanel[] {
  return [
    {
      scene: 'Pagi yang cerah di kampung. Ali keluar rumah bersama kucingnya, Comel.',
      imagePrompt:
        'wide shot of a sunny Malaysian village morning, wooden house, coconut trees, Ali on the left waving, Comel on the right stretching',
      characters: ['Ali', 'Comel'],
      wide: true,
      caption: `Suatu pagi... ${shortIdea(idea, 10)}`,
      sfx: null,
      dialogue: [
        { speaker: 'Ali', text: 'Jom Comel, hari ni kita ada misi!', kind: 'speech', position: 'top-left' },
      ],
    },
    {
      scene: 'Comel kelihatan ragu-ragu.',
      imagePrompt:
        'medium shot, Comel on the right raising one eyebrow, Ali on the left grinning confidently',
      characters: ['Ali', 'Comel'],
      wide: false,
      caption: null,
      sfx: null,
      dialogue: [
        { speaker: 'Comel', text: 'Meow? (Misi apa pula ni...)', kind: 'thought', position: 'top-right' },
      ],
    },
    {
      scene: 'Ali menerangkan rancangannya dengan penuh semangat.',
      imagePrompt: 'close-up of Ali on the left pointing at the sky excitedly, sparkles around him',
      characters: ['Ali'],
      wide: false,
      caption: null,
      sfx: null,
      dialogue: [
        {
          speaker: 'Ali',
          text: 'Rancangan aku sempurna. Takkan gagal punya!',
          kind: 'speech',
          position: 'top-left',
        },
      ],
    },
    {
      scene: 'Tiba-tiba sesuatu yang tidak dijangka berlaku!',
      imagePrompt:
        'dynamic shot, Ali on the left slipping on a banana peel, Comel on the right jumping in surprise',
      characters: ['Ali', 'Comel'],
      wide: false,
      caption: null,
      sfx: 'GEDEBUK!',
      dialogue: [{ speaker: 'Ali', text: 'Alamak!', kind: 'shout', position: 'top-left' }],
    },
    {
      scene: 'Comel cuba menolong Ali bangun.',
      imagePrompt:
        'medium shot, Comel on the right pulling Ali by the sleeve, Ali on the left sitting on the ground dizzy',
      characters: ['Ali', 'Comel'],
      wide: false,
      caption: 'Beberapa saat kemudian...',
      sfx: null,
      dialogue: [{ speaker: 'Comel', text: 'Meow meow!', kind: 'speech', position: 'top-right' }],
    },
    {
      scene: 'Ali mendapat idea baru.',
      imagePrompt:
        'close-up of Ali on the left with a big smile, a lightbulb moment, Comel on the right looking worried',
      characters: ['Ali', 'Comel'],
      wide: false,
      caption: null,
      sfx: 'TING!',
      dialogue: [
        { speaker: 'Ali', text: 'Aha! Aku ada idea yang lagi hebat!', kind: 'speech', position: 'top-left' },
      ],
    },
    {
      scene: 'Mereka berdua mencuba sekali lagi bersama-sama.',
      imagePrompt:
        'wide shot, Ali and Comel running together across a field toward the sunset, energetic poses',
      characters: ['Ali', 'Comel'],
      wide: false,
      caption: null,
      sfx: 'ZOOM!',
      dialogue: [],
    },
    {
      scene: 'Akhirnya mereka berjaya dan ketawa bersama.',
      imagePrompt:
        'warm wide shot, Ali on the left laughing, Comel on the right purring happily, golden evening light',
      characters: ['Ali', 'Comel'],
      wide: true,
      caption: 'TAMAT',
      sfx: null,
      dialogue: [
        { speaker: 'Ali', text: 'Kita memang pasukan terbaik!', kind: 'speech', position: 'top-left' },
        { speaker: 'Comel', text: 'Purrr~', kind: 'speech', position: 'top-right' },
      ],
    },
  ];
}

function panelsEn(idea: string): DemoPanel[] {
  const ms = panelsMs(idea);
  type EnglishPanel = Pick<DemoPanel, 'scene' | 'caption' | 'sfx'> & { lines: string[] };
  const english: EnglishPanel[] = [
    {
      scene: 'A sunny village morning. Ali heads out with his cat, Comel.',
      caption: `One morning... ${shortIdea(idea, 10)}`,
      sfx: null,
      lines: ["Come on Comel, we've got a mission today!"],
    },
    { scene: 'Comel looks doubtful.', caption: null, sfx: null, lines: ['Meow? (What mission now...)'] },
    {
      scene: 'Ali explains his plan with great excitement.',
      caption: null,
      sfx: null,
      lines: ['My plan is perfect. It cannot fail!'],
    },
    { scene: 'Suddenly, something unexpected happens!', caption: null, sfx: 'THUD!', lines: ['Oh no!'] },
    {
      scene: 'Comel tries to help Ali up.',
      caption: 'A few seconds later...',
      sfx: null,
      lines: ['Meow meow!'],
    },
    {
      scene: 'Ali gets a new idea.',
      caption: null,
      sfx: 'DING!',
      lines: ['Aha! I have an even better idea!'],
    },
    { scene: 'They try again, together.', caption: null, sfx: 'ZOOM!', lines: [] },
    {
      scene: 'They finally succeed and laugh together.',
      caption: 'THE END',
      sfx: null,
      lines: ["We're the best team ever!", 'Purrr~'],
    },
  ];
  return ms.map((panel, i) => ({
    ...panel,
    scene: english[i].scene,
    caption: english[i].caption,
    sfx: english[i].sfx,
    dialogue: panel.dialogue.map((d, j) => ({ ...d, text: english[i].lines[j] ?? d.text })),
  }));
}

const PICK: Record<number, number[]> = {
  4: [0, 2, 3, 7],
  6: [0, 1, 2, 3, 5, 7],
  8: [0, 1, 2, 3, 4, 5, 6, 7],
};

export function demoScript(req: ComicRequest): ComicScriptOutput {
  const all = req.language === 'ms' ? panelsMs(req.idea) : panelsEn(req.idea);
  const indexes = PICK[req.panelCount] ?? PICK[6];
  return {
    title: req.language === 'ms' ? `Misi Ali & Comel` : `Ali & Comel's Mission`,
    synopsis:
      req.language === 'ms'
        ? 'Komik demo — tetapkan ANTHROPIC_API_KEY untuk cerita sebenar daripada idea anda.'
        : 'Demo comic — set ANTHROPIC_API_KEY to get a real story from your idea.',
    setting: 'a sunny Malaysian village (kampung) with wooden houses and coconut trees, present day',
    characters: CHARACTERS,
    panels: indexes.map((i) => all[i]),
  };
}

// ---------- Procedural demo artwork ----------

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const SKIES = [
  ['#7EC8F2', '#CDEBFF'],
  ['#FFB47A', '#FFE3B8'],
  ['#9B8CFF', '#DCD6FF'],
  ['#5FD3B3', '#D2F7EC'],
  ['#FF8FA3', '#FFD9E0'],
];

function boy(x: number, y: number, s: number, mood: number): string {
  const mouth =
    mood > 0.5
      ? `<path d="M${x - 10 * s} ${y - 52 * s} Q${x} ${y - 40 * s} ${x + 10 * s} ${y - 52 * s}" stroke="#1a1a1a" stroke-width="${3 * s}" fill="none"/>`
      : `<ellipse cx="${x}" cy="${y - 48 * s}" rx="${6 * s}" ry="${8 * s}" fill="#1a1a1a"/>`;
  return `<g stroke="#1a1a1a" stroke-width="${4 * s}" stroke-linejoin="round">
  <rect x="${x - 26 * s}" y="${y - 20 * s}" width="${52 * s}" height="${60 * s}" rx="${12 * s}" fill="#E63946"/>
  <rect x="${x - 24 * s}" y="${y + 38 * s}" width="${48 * s}" height="${26 * s}" rx="${6 * s}" fill="#2D6CDF"/>
  <rect x="${x + 22 * s}" y="${y - 14 * s}" width="${14 * s}" height="${40 * s}" rx="${5 * s}" fill="#FFD23F"/>
  <circle cx="${x}" cy="${y - 62 * s}" r="${38 * s}" fill="#C68B59"/>
  <path d="M${x - 38 * s} ${y - 70 * s} L${x - 30 * s} ${y - 104 * s} L${x - 14 * s} ${y - 92 * s} L${x} ${y - 110 * s} L${x + 14 * s} ${y - 92 * s} L${x + 30 * s} ${y - 104 * s} L${x + 38 * s} ${y - 70 * s} Z" fill="#1a1a1a"/>
  <circle cx="${x - 13 * s}" cy="${y - 66 * s}" r="${5 * s}" fill="#1a1a1a" stroke="none"/>
  <circle cx="${x + 13 * s}" cy="${y - 66 * s}" r="${5 * s}" fill="#1a1a1a" stroke="none"/>
</g>${mouth}`;
}

function cat(x: number, y: number, s: number): string {
  return `<g stroke="#1a1a1a" stroke-width="${4 * s}" stroke-linejoin="round">
  <path d="M${x + 40 * s} ${y + 20 * s} Q${x + 80 * s} ${y} ${x + 70 * s} ${y - 40 * s}" fill="none" stroke-width="${10 * s}" stroke="#F4A259"/>
  <ellipse cx="${x}" cy="${y + 18 * s}" rx="${46 * s}" ry="${34 * s}" fill="#F4A259"/>
  <circle cx="${x}" cy="${y - 34 * s}" r="${32 * s}" fill="#F4A259"/>
  <polygon points="${x - 28 * s},${y - 50 * s} ${x - 22 * s},${y - 84 * s} ${x - 4 * s},${y - 62 * s}" fill="#F4A259"/>
  <polygon points="${x + 28 * s},${y - 50 * s} ${x + 22 * s},${y - 84 * s} ${x + 4 * s},${y - 62 * s}" fill="#F4A259"/>
  <ellipse cx="${x - 12 * s}" cy="${y - 38 * s}" rx="${7 * s}" ry="${9 * s}" fill="#5BBA6F"/>
  <ellipse cx="${x + 12 * s}" cy="${y - 38 * s}" rx="${7 * s}" ry="${9 * s}" fill="#5BBA6F"/>
  <rect x="${x - 22 * s}" y="${y - 10 * s}" width="${44 * s}" height="${8 * s}" rx="${4 * s}" fill="#2D6CDF"/>
  <circle cx="${x}" cy="${y + 2 * s}" r="${6 * s}" fill="#FFD23F"/>
</g>`;
}

export function demoPanelSvg(body: PanelImageRequestBody, size: { width: number; height: number }): string {
  const { width: w, height: h } = size;
  const rand = rng(body.seed);
  const [skyTop, skyBottom] = SKIES[Math.floor(rand() * SKIES.length)];
  const ground = h * 0.72;
  const s = Math.min(w, h) / 520;
  const hasAli = body.panel.characters.includes('Ali');
  const hasCat = body.panel.characters.includes('Comel');
  const hills = Array.from({ length: 3 }, (_, i) => {
    const cx = rand() * w;
    const r = (0.25 + rand() * 0.2) * w;
    return `<ellipse cx="${cx}" cy="${ground + 10}" rx="${r}" ry="${r * 0.35}" fill="${i % 2 ? '#7CC67A' : '#5DAE5B'}"/>`;
  }).join('');
  const clouds = Array.from({ length: 3 }, () => {
    const cx = rand() * w;
    const cy = h * (0.08 + rand() * 0.12);
    return `<g fill="#FFFFFF" opacity="0.9"><ellipse cx="${cx}" cy="${cy}" rx="${50 * s}" ry="${20 * s}"/><ellipse cx="${cx + 30 * s}" cy="${cy - 12 * s}" rx="${34 * s}" ry="${18 * s}"/></g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient></defs>
<rect x="0" y="0" width="${w}" height="${h}" fill="url(#sky)"/>
<circle cx="${w * 0.85}" cy="${h * 0.3}" r="${40 * s}" fill="#FFE066" stroke="#1a1a1a" stroke-width="${3 * s}"/>
${clouds}${hills}
<rect x="0" y="${ground}" width="${w}" height="${h - ground}" fill="#8BD17C" stroke="#1a1a1a" stroke-width="${4 * s}"/>
${hasAli ? boy(w * (hasCat ? 0.3 : 0.5), ground - 30 * s, s * 1.4, rand()) : ''}
${hasCat ? cat(w * (hasAli ? 0.72 : 0.5), ground - 10 * s, s * 1.2) : ''}
</svg>`;
}
