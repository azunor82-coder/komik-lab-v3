import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

/** Server-side client; reads ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) from the environment. */
export function getAnthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}
