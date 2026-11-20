import { buildRows } from '@/lib/layout';
import type { ComicScript } from '@/lib/types';

import { UserFacingError } from './http';
import type { ComicScriptOutput } from './schema';

/**
 * Cleans up a generated script so the app can rely on its shape:
 * exact panel count, bounded dialogue, and a sensible number of wide panels.
 */
export function normalizeScript(script: ComicScriptOutput, panelCount: number): ComicScript {
  if (script.panels.length < Math.min(3, panelCount)) {
    throw new UserFacingError('Skrip yang dijana terlalu pendek. Cuba lagi.', 502);
  }

  const maxWide = panelCount <= 4 ? 1 : 2;
  let wideCount = 0;

  const panels = script.panels.slice(0, panelCount).map((panel) => {
    let wide = panel.wide;
    if (wide) {
      wideCount += 1;
      if (wideCount > maxWide) wide = false;
    }
    return {
      ...panel,
      wide,
      caption: panel.caption?.trim() || null,
      sfx: panel.sfx?.trim() || null,
      dialogue: panel.dialogue
        .filter((line) => line.text.trim().length > 0)
        .slice(0, 3)
        .map((line) => ({ ...line, text: line.text.trim() })),
    };
  });

  // A normal panel without a partner fills its row, so draw it wide.
  for (const row of buildRows(panels)) {
    if (row.length === 1) row[0].wide = true;
  }

  return {
    title: script.title.trim(),
    synopsis: script.synopsis.trim(),
    setting: script.setting.trim(),
    characters: script.characters.slice(0, 6),
    panels,
  };
}
