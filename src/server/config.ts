// Server-only configuration read from environment variables.
// Never import this file from app (client) code.

import { DEFAULT_CLAUDE_MODEL } from '@/core/claude';
import {
  DEFAULT_OPENAI_IMAGE_MODEL,
  DEFAULT_POLLINATIONS_BASE_URL,
  DEFAULT_POLLINATIONS_MODEL,
} from '@/core/images';

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Demo mode: no Anthropic credentials, or explicitly forced with DEMO_MODE=1. */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === '1' || !hasAnthropicKey();
}

export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || DEFAULT_OPENAI_IMAGE_MODEL;

export const POLLINATIONS_BASE_URL = process.env.POLLINATIONS_BASE_URL || DEFAULT_POLLINATIONS_BASE_URL;

export const POLLINATIONS_MODEL = process.env.POLLINATIONS_MODEL || DEFAULT_POLLINATIONS_MODEL;
