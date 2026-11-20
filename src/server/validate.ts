import { z } from 'zod';

import { PANEL_COUNTS } from '@/lib/options';
import type { ComicRequest, PanelImageRequestBody } from '@/lib/types';

import { UserFacingError } from './http';
import { BubbleKindSchema, BubblePositionSchema } from './schema';

const ProviderSchema = z.enum(['pollinations', 'openai', 'claude-svg']);

const ComicRequestSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(5, 'Idea terlalu pendek.')
    .max(2000, 'Idea terlalu panjang (maks 2000 aksara).'),
  genre: z.string().max(40),
  artStyle: z.string().max(40),
  panelCount: z
    .number()
    .int()
    .refine((n) => (PANEL_COUNTS as readonly number[]).includes(n), {
      message: 'Bilangan panel mesti 4, 6 atau 8.',
    }),
  language: z.enum(['ms', 'en']),
  provider: ProviderSchema,
});

const PanelImageRequestSchema = z.object({
  provider: ProviderSchema,
  artStyle: z.string().max(40),
  setting: z.string().max(1000),
  characters: z.array(z.object({ name: z.string().max(80), appearance: z.string().max(1000) })).max(8),
  panel: z.object({
    scene: z.string().max(1000),
    imagePrompt: z.string().min(1).max(2000),
    characters: z.array(z.string().max(80)).max(8),
    wide: z.boolean(),
    dialogue: z
      .array(
        z.object({
          speaker: z.string().max(80),
          text: z.string().max(400),
          kind: BubbleKindSchema,
          position: BubblePositionSchema,
        })
      )
      .max(6),
  }),
  seed: z.number().int().nonnegative(),
});

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new UserFacingError(first?.message ?? 'Data permintaan tidak sah.', 400);
  }
  return result.data;
}

export const parseComicRequest = (data: unknown): ComicRequest => parse(ComicRequestSchema, data);

export const parsePanelImageRequest = (data: unknown): PanelImageRequestBody =>
  parse(PanelImageRequestSchema, data);
