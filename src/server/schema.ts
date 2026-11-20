import { z } from 'zod';

// JSON schema for Claude's structured output. Kept to features supported by
// structured outputs (objects, arrays, enums, nullable) — counts and lengths are
// enforced in the prompt and normalised in code afterwards.

export const BubbleKindSchema = z.enum(['speech', 'thought', 'shout', 'whisper']);

export const BubblePositionSchema = z.enum([
  'top-left',
  'top',
  'top-right',
  'bottom-left',
  'bottom',
  'bottom-right',
]);

export const CharacterSchema = z.object({
  name: z.string().describe('Short name used consistently in panels and dialogue.'),
  appearance: z
    .string()
    .describe(
      'Specific visual description in ENGLISH: age, body type, skin tone, hair, outfit with colours, one distinctive item. For animals: species, fur colour, markings, accessories.'
    ),
});

export const DialogueSchema = z.object({
  speaker: z.string().describe('Character name, or "Narrator" for off-panel voices.'),
  text: z.string().describe('What is said, in the comic language. Max ~15 words.'),
  kind: BubbleKindSchema,
  position: BubblePositionSchema.describe(
    'Where the bubble goes — on the same side of the panel as the speaker.'
  ),
});

export const PanelSchema = z.object({
  scene: z.string().describe('One or two sentences, in the comic language, describing what happens.'),
  imagePrompt: z
    .string()
    .describe(
      'Visual-only description in ENGLISH for an image model: camera shot, setting details, which characters are where (left/right), poses, expressions, lighting. Mention characters by name. No text, no speech bubbles, no art style words.'
    ),
  characters: z.array(z.string()).describe('Names of characters visible in this panel.'),
  wide: z.boolean().describe('True for a full-width establishing or climactic panel.'),
  caption: z.string().nullable().describe('Optional narration box text in the comic language.'),
  sfx: z.string().nullable().describe('Optional sound effect word, e.g. "BAM!", "Zzz", "KRING!".'),
  dialogue: z.array(DialogueSchema).describe('0 to 3 lines.'),
});

export const ComicScriptSchema = z.object({
  title: z.string().describe('Catchy comic title in the comic language.'),
  synopsis: z.string().describe('One-sentence summary in the comic language.'),
  setting: z.string().describe('Main location and time period, in ENGLISH, for the image model.'),
  characters: z.array(CharacterSchema),
  panels: z.array(PanelSchema),
});

export type ComicScriptOutput = z.infer<typeof ComicScriptSchema>;
