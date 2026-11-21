// Web preview: images stay as data URIs inside the stored comic.
// (Browser storage is small, so the web build is meant for trying the app.)

export async function persistImage(_comicId: string, _panelId: string, dataUri: string): Promise<string> {
  return dataUri;
}

/** Web: fetch the image and keep it as a data URI (also keeps PNG export CORS-safe). */
export async function persistRemoteImage(_comicId: string, _panelId: string, url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Tidak dapat memuat turun gambar. Semak sambungan internet anda.');
  }
  if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) {
    throw new Error(
      res.status === 429
        ? 'Pollinations sedang sibuk (had kadar). Tunggu sebentar dan jana semula.'
        : 'Pollinations gagal menjana gambar. Cuba lagi atau tukar penjana.'
    );
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca gambar.'));
    reader.readAsDataURL(blob);
  });
}

export function deleteImageFile(_uri: string) {}

export function deleteComicImages(_comicId: string) {}
