import { getRepository } from '../db/repository';

const pending = new Map<string, Promise<string | null>>();

function toBase64(bytes: Uint8Array): string | null {
  const encode = (globalThis as { btoa?: (value: string) => string }).btoa;

  if (!encode) {
    return null;
  }

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return encode(binary);
}

export function readCachedImage(url: string): string | null {
  try {
    return getRepository().readImage(url);
  } catch {
    return null;
  }
}

export function cacheImage(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:')) {
    return Promise.resolve(url || null);
  }

  const cached = readCachedImage(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const current = pending.get(url);
  if (current) {
    return current;
  }

  const task = fetch(url)
    .then(async response => {
      if (!response.ok) {
        return null;
      }

      const type =
        response.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
      const encoded = toBase64(new Uint8Array(await response.arrayBuffer()));

      if (!encoded) {
        return null;
      }

      const dataUri = `data:${type};base64,${encoded}`;
      getRepository().saveImage(url, dataUri);
      return dataUri;
    })
    .catch(() => null)
    .finally(() => {
      pending.delete(url);
    });

  pending.set(url, task);
  return task;
}

export function cacheImages(urls: string[]) {
  const unique = [...new Set(urls.filter(url => url.length > 0))];

  unique.reduce(
    (queue, url) => queue.then(() => cacheImage(url).then(() => undefined)),
    Promise.resolve(),
  );
}
