import type { StatusResponseBody } from '@/lib/types';
import { CLAUDE_MODEL, hasAnthropicKey, hasOpenAIKey, isDemoMode } from '@/server/config';

export function GET(): Response {
  const body: StatusResponseBody = {
    anthropic: hasAnthropicKey(),
    openai: hasOpenAIKey(),
    pollinations: true,
    demo: isDemoMode(),
    model: CLAUDE_MODEL,
  };
  return Response.json(body);
}
