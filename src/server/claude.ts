import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { ART_STYLES, GENRES, findLabel } from '@/lib/options';
import type { Character, ComicRequest, PanelImageRequestBody } from '@/lib/types';

import { CLAUDE_MODEL } from './config';
import { UserFacingError } from './http';
import { ComicScriptSchema, type ComicScriptOutput } from './schema';
import { sanitizeSvg } from './svg';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) from the environment.
  client ??= new Anthropic();
  return client;
}

// Server-side refusal fallback: if a safety classifier declines, the API
// re-runs the request on Anthropic's recommended fallback model.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const SCRIPT_SYSTEM = `You are an award-winning comic writer and storyboard artist.
You turn a short idea into a complete, self-contained short comic that will be drawn panel by panel by an image-generation model and then lettered by software (speech bubbles, captions and sound effects are added on top of the images later).

Writing rules:
- Produce EXACTLY the requested number of panels with a clear beginning, build-up and a satisfying ending or punchline in the last panel.
- All reader-facing text (title, synopsis, scene, caption, dialogue, sfx) must be in the requested comic language. If the language is Bahasa Melayu, write natural, everyday Malaysian Malay — friendly and lively, light slang is fine.
- Dialogue must be short: at most 3 lines per panel and about 15 words per line, so bubbles fit inside the panel. Some panels can be silent.
- Use captions sparingly for narration, time skips or inner context. Use sfx only when a sound adds punch.
- Keep everything family-friendly.

Visual rules (for the image model):
- Define 1 to 4 main characters. Give each a very specific, distinctive appearance in ENGLISH (age, body type, skin tone, hairstyle and colour, outfit with exact colours, one signature accessory). Animals and objects-as-characters need species/colours/markings too. These descriptions are pasted into every image prompt, so make them precise and stable.
- "setting" is the main location and era in ENGLISH.
- "imagePrompt" is in ENGLISH and purely visual: camera shot (wide shot, medium shot, close-up, over-the-shoulder, bird's-eye...), environment details, which named characters are on the LEFT or RIGHT, poses, actions, facial expressions, lighting and mood. Never ask for text, letters, signs with writing, speech bubbles or captions. Do not mention an art style — the app adds it.
- Vary the camera shots across panels to keep the page dynamic.
- Put each speech bubble on the same side as its speaker in the image (speaker on the left -> "top-left", on the right -> "top-right", centred -> "top"). Prefer top positions; use bottom positions only when the top is crowded.
- Mark 1 or 2 panels as "wide" (establishing shot or climax); all others false. For 4 panels use at most 1 wide panel.`;

function scriptUserPrompt(req: ComicRequest): string {
  const language = req.language === 'ms' ? 'Bahasa Melayu' : 'English';
  return `Create a comic script.

Idea: ${req.idea}
Genre: ${findLabel(GENRES, req.genre)} (${req.genre})
Art style (for your awareness only; do not put it in imagePrompt): ${findLabel(ART_STYLES, req.artStyle)}
Number of panels: exactly ${req.panelCount}
Comic language: ${language}`;
}

export async function generateScript(req: ComicRequest): Promise<ComicScriptOutput> {
  const response = await getClient().beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: betaZodOutputFormat(ComicScriptSchema),
    },
    system: SCRIPT_SYSTEM,
    messages: [{ role: 'user', content: scriptUserPrompt(req) }],
  });

  if (response.stop_reason === 'refusal') {
    throw new UserFacingError('Claude tidak dapat menulis cerita untuk idea ini. Cuba idea yang lain.', 422);
  }
  if (response.stop_reason === 'max_tokens') {
    throw new UserFacingError('Skrip terlalu panjang. Cuba kurangkan bilangan panel.', 422);
  }
  if (!response.parsed_output) {
    throw new UserFacingError('Claude memulangkan skrip yang tidak lengkap. Cuba lagi.', 502);
  }
  return response.parsed_output;
}

const SVG_SYSTEM = `You are a comic illustrator who draws single comic panels as hand-written SVG.
Return ONLY one complete <svg> element — no markdown fences, no explanation.

Technical rules (the SVG is rendered by react-native-svg, which supports a limited subset):
- Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H"> using the exact width and height given.
- Allowed elements only: svg, g, defs, rect, circle, ellipse, line, polyline, polygon, path, linearGradient, radialGradient, stop.
- Do NOT use: text, tspan, style, CSS classes, filter, mask, pattern, image, use, foreignObject, script, animations, or external references.
- Set colours with fill / stroke attributes directly on elements. Gradients are allowed via defs + url(#id).
- Keep the file compact: roughly 40-150 shapes. Prefer paths for organic shapes.

Art rules:
- Fill the whole canvas with a background (sky, room, street...) first.
- Bold dark outlines (stroke="#1a1a1a", stroke-width 3-6) and flat colours with one simple shadow tone, like a modern cartoon.
- Draw the characters clearly with readable poses and facial expressions (eyes, eyebrows, mouth) that match the scene.
- Keep each character's colours exactly as described so they stay consistent across panels.
- Leave the top ~22% of the canvas visually calm (sky, wall, ceiling) because speech bubbles will be placed there.
- Never draw letters, words, numbers, speech bubbles or captions.`;

function describeCharacters(all: Character[], names: string[]): string {
  const present = all.filter((c) => names.includes(c.name));
  const list = present.length > 0 ? present : [];
  if (list.length === 0) return 'No main characters visible.';
  return list.map((c) => `- ${c.name}: ${c.appearance}`).join('\n');
}

export async function drawPanelSvg(
  body: PanelImageRequestBody,
  stylePrompt: string,
  size: { width: number; height: number }
): Promise<string> {
  const { panel } = body;
  const speakers = panel.dialogue.map((d) => `${d.speaker} (${d.position})`).join(', ');

  const userPrompt = `Draw this comic panel.

Canvas: width ${size.width}, height ${size.height}
Style hint: ${stylePrompt}
Setting: ${body.setting}
Characters in this panel:
${describeCharacters(body.characters, panel.characters)}

Panel description: ${panel.imagePrompt}
${speakers ? `Speakers and their bubble positions (place each speaker on that side): ${speakers}` : ''}`;

  const response = await getClient().beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    // Lower effort keeps each panel fast; raise to "medium" for more detailed drawings.
    output_config: { effort: 'low' },
    system: SVG_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  if (response.stop_reason === 'refusal') {
    throw new UserFacingError('Claude tidak dapat melukis panel ini.', 422);
  }

  const text = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
  const svg = sanitizeSvg(text);
  if (!svg) {
    throw new UserFacingError(
      response.stop_reason === 'max_tokens'
        ? 'Lukisan SVG terlalu panjang dan terpotong. Cuba jana semula.'
        : 'Claude tidak memulangkan SVG yang sah. Cuba jana semula.',
      502
    );
  }
  return svg;
}
