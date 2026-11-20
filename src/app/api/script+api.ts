import type { ScriptResponseBody } from '@/lib/types';
import { generateScript } from '@/server/claude';
import { isDemoMode } from '@/server/config';
import { demoScript } from '@/server/demo';
import { checkAccess, errorResponse, readJson } from '@/server/http';
import { normalizeScript } from '@/server/normalize';
import { parseComicRequest } from '@/server/validate';

export async function POST(request: Request): Promise<Response> {
  try {
    checkAccess(request);
    const comicRequest = parseComicRequest(await readJson(request));
    const demo = isDemoMode();
    const raw = demo ? demoScript(comicRequest) : await generateScript(comicRequest);
    const body: ScriptResponseBody = {
      script: normalizeScript(raw, comicRequest.panelCount),
      demo,
    };
    return Response.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}
