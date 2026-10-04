import { productDetailApi } from './productDetailApi';
import { createTestStore } from '../../../test/store';
import { product } from '../../../test/product';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 404,
    json: async () => body,
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

describe('product detail api', () => {
  it('caches a product after it loads', async () => {
    const { store, repository } = createTestStore();
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ ...product(), brand: null, images: undefined }),
    );

    const result = await store.dispatch(
      productDetailApi.endpoints.getProduct.initiate(1),
    );

    expect(result).toEqual(expect.objectContaining({ status: 'fulfilled' }));
    expect(repository.readProduct(1)?.images).toEqual([]);
    expect(repository.readProduct(1)?.brand).toBeUndefined();
  });

  it('keeps the result when caching fails and reports a bad request', async () => {
    const { store, repository } = createTestStore();
    repository.upsertProducts = () => {
      throw new Error('disk');
    };
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(product()));
    const saved = await store.dispatch(
      productDetailApi.endpoints.getProduct.initiate(1),
    );
    expect(saved).toEqual(expect.objectContaining({ status: 'fulfilled' }));

    globalThis.fetch = jest.fn().mockRejectedValue('down');
    const failed = await store.dispatch(
      productDetailApi.endpoints.getProduct.initiate(2, { forceRefetch: true }),
    );
    expect(failed).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ error: 'Failed to fetch product' }),
      }),
    );
  });
});
