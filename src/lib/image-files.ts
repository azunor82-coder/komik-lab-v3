import { Directory, File, Paths } from 'expo-file-system';

// Native: panel images are written to the app's document directory so the
// library works offline and AsyncStorage only holds small file URIs.

function comicDir(comicId: string): Directory {
  return new Directory(Paths.document, 'comics', comicId);
}

export async function persistImage(comicId: string, panelId: string, dataUri: string): Promise<string> {
  const match = dataUri.match(/^data:image\/([a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) throw new Error('Format gambar tidak dikenali.');
  const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase().replace(/\W/g, '');
  const dir = comicDir(comicId);
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `${panelId}-${Date.now()}.${ext}`);
  file.create({ overwrite: true });
  await file.write(match[2], { encoding: 'base64' });
  return file.uri;
}

/** Downloads an image URL (e.g. Pollinations) straight into the comic's folder. */
export async function persistRemoteImage(comicId: string, panelId: string, url: string): Promise<string> {
  const dir = comicDir(comicId);
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `${panelId}-${Date.now()}.jpg`);
  try {
    const downloaded = await File.downloadFileAsync(url, file, { idempotent: true });
    return downloaded.uri;
  } catch (error) {
    console.warn('[images] muat turun gagal', error);
    throw new Error(remoteErrorMessage(error));
  }
}

function remoteErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/\b429\b/.test(text)) return 'Pollinations sedang sibuk (had kadar). Tunggu sebentar dan jana semula.';
  if (/\b(4|5)\d\d\b/.test(text)) return 'Pollinations gagal menjana gambar. Cuba lagi atau tukar penjana.';
  return 'Tidak dapat memuat turun gambar. Semak sambungan internet anda.';
}

export function deleteImageFile(uri: string) {
  if (!uri.startsWith('file:')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[images] gagal memadam fail', error);
  }
}

export function deleteComicImages(comicId: string) {
  try {
    const dir = comicDir(comicId);
    if (dir.exists) dir.delete();
  } catch (error) {
    console.warn('[images] gagal memadam folder komik', error);
  }
}
