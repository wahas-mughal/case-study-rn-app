import { render } from '@testing-library/react-native';

import { CachedImage } from './CachedImage';
import { setRepository } from '../db/repository';
import { createMemoryRepository } from '../../test/memoryRepository';

describe('CachedImage', () => {
  it('prefers a cached data uri and falls back to the remote uri', async () => {
    const repository = createMemoryRepository();
    repository.saveImage('https://example.com/saved.jpg', 'data:image/jpeg,saved');
    setRepository(repository);
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => Uint8Array.from([1]).buffer,
    });

    const saved = await render(
      <CachedImage uri="https://example.com/saved.jpg" />,
    );
    expect(saved.toJSON()).toMatchObject({
      type: 'Image',
      props: { source: { uri: 'data:image/jpeg,saved' } },
    });

    const remote = await render(
      <CachedImage uri="https://example.com/new.jpg" />,
    );
    expect(remote.toJSON()).toMatchObject({
      type: 'Image',
      props: {
        source: { uri: expect.stringMatching(/^data:image\/jpeg;base64,/) },
      },
    });
  });
});
