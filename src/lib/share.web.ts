import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Web: captures the comic page and downloads it as a PNG file. */
export async function shareComicImage(
  view: RefObject<ComponentRef<typeof View> | null>,
  title: string
): Promise<void> {
  const dataUri = await captureRef(view, { format: 'png', quality: 1, result: 'data-uri' });
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `${title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'komik'}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
