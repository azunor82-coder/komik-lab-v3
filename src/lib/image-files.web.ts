// Web preview: images stay as data URIs inside the stored comic.
// (Browser storage is small, so the web build is meant for trying the app.)

export async function persistImage(_comicId: string, _panelId: string, dataUri: string): Promise<string> {
  return dataUri;
}

export function deleteImageFile(_uri: string) {}

export function deleteComicImages(_comicId: string) {}
