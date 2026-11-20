import type { PanelImageResponseBody } from '@/lib/types';
import { isDemoMode } from '@/server/config';
import { checkAccess, errorResponse, readJson } from '@/server/http';
import { generatePanelImage } from '@/server/images';
import { parsePanelImageRequest } from '@/server/validate';

export async function POST(request: Request): Promise<Response> {
  try {
    checkAccess(request);
    const body = parsePanelImageRequest(await readJson(request));
    const image = await generatePanelImage(body);
    const response: PanelImageResponseBody = {
      image,
      demo: body.provider === 'claude-svg' && isDemoMode(),
    };
    return Response.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
