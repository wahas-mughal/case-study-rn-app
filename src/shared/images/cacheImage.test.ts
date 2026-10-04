import { cacheImage, cacheImages, readCachedImage } from './cacheImage';
import { setRepository } from '../db/repository';
import { createMemoryRepository } from '../../test/memoryRepository';

describe('image cache', () => {
  const repository = createMemoryRepository();

  beforeEach(() => {
    setRepository(repository);
  });

  it('returns empty and data urls without fetching', async () => {
    await expect(cacheImage('')).resolves.toBeNull();
    await expect(cacheImage('data:image/png,abc')).resolves.toBe(
      'data:image/png,abc',
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns a saved image without fetching again', async () => {
    repository.saveImage('https://example.com/a.jpg', 'data:image/jpeg,saved');

    await expect(cacheImage('https://example.com/a.jpg')).resolves.toBe(
      'data:image/jpeg,saved',
    );
    expect(readCachedImage('https://example.com/a.jpg')).toBe(
      'data:image/jpeg,saved',
    );
  });

  it('stores fetched bytes and shares one request', async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    globalThis.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve;
        }),
    );
    const bytes = Uint8Array.from([1, 2, 3]);

    const first = cacheImage('https://example.com/b.jpg');
    const second = cacheImage('https://example.com/b.jpg');

    resolveFetch({
      ok: true,
      headers: { get: () => 'image/png; charset=binary' },
      arrayBuffer: async () => bytes.buffer,
    } as unknown as Response);
    const saved = await first;

    expect(await second).toBe(saved);
    expect(saved).toMatch(/^data:image\/png;base64,/);
    expect(readCachedImage('https://example.com/b.jpg')).toBe(saved);
  });

  it('returns null when the image request fails or cannot be encoded', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      headers: { get: () => null },
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    await expect(cacheImage('https://example.com/c.jpg')).resolves.toBeNull();

    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(cacheImage('https://example.com/d.jpg')).resolves.toBeNull();

    const scope = globalThis as { btoa?: (value: string) => string };
    const encode = scope.btoa;
    delete scope.btoa;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      arrayBuffer: async () => Uint8Array.from([9]).buffer,
    });
    await expect(cacheImage('https://example.com/e.jpg')).resolves.toBeNull();
    scope.btoa = encode;
  });

  it('returns null when the image lookup throws', () => {
    setRepository({
      ...repository,
      readImage() {
        throw new Error('closed');
      },
    });

    expect(readCachedImage('https://example.com/missing.jpg')).toBeNull();
  });

  it('queues unique urls', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => Uint8Array.from([4]).buffer,
    });

    cacheImages([
      '',
      'https://example.com/f.jpg',
      'https://example.com/f.jpg',
      'https://example.com/g.jpg',
    ]);

    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
