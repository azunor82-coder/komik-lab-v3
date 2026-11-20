import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Captures the comic page as a PNG and opens the native share sheet. */
export async function shareComicImage(
  view: RefObject<ComponentRef<typeof View> | null>,
  title: string
): Promise<void> {
  const uri = await captureRef(view, { format: 'png', quality: 1, result: 'tmpfile' });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Perkongsian tidak disokong pada peranti ini.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title, UTI: 'public.png' });
}
