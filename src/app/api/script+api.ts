import type { ScriptResponseBody } from '@/lib/types';
import { generateScript } from '@/core/claude';
import { demoScript } from '@/core/demo';
import { normalizeScript } from '@/core/normalize';
import { getAnthropic } from '@/server/anthropic';
import { CLAUDE_MODEL, isDemoMode } from '@/server/config';
import { checkAccess, errorResponse, readJson } from '@/server/http';
import { parseComicRequest } from '@/server/validate';

export async function POST(request: Request): Promise<Response> {
  try {
    checkAccess(request);
    const comicRequest = parseComicRequest(await readJson(request));
    const demo = isDemoMode();
    const raw = demo
      ? demoScript(comicRequest)
      : await generateScript(getAnthropic(), CLAUDE_MODEL, comicRequest);
    const body: ScriptResponseBody = {
      script: normalizeScript(raw, comicRequest.panelCount),
      demo,
    };
    return Response.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}
