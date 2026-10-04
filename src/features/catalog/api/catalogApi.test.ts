import { catalogApi, toCategories, toProductsPage } from './catalogApi';
import { createTestStore } from '../../../test/store';
import { product } from '../../../test/product';

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

function page(products: ReturnType<typeof product>[], extra = {}) {
  return {
    products,
    total: products.length,
    skip: 0,
    limit: 20,
    ...extra,
  };
}

describe('catalog api', () => {
  it('normalizes product and category payloads', () => {
    expect(
      toProductsPage({
        products: [
          {
            ...product(),
            brand: null,
            images: undefined,
          },
        ],
        total: 1,
        skip: 0,
        limit: 20,
      } as never).products[0],
    ).toMatchObject({ brand: undefined, images: [] });

    expect(toCategories(['phones', { slug: 'laptops', name: 'Laptops', url: 'u' }])).toEqual([
      {
        slug: 'phones',
        name: 'phones',
        url: 'https://dummyjson.com/products/category/phones',
      },
      { slug: 'laptops', name: 'Laptops', url: 'u' },
    ]);
  });

  it('loads, merges, and caches product pages', async () => {
    const { store, repository } = createTestStore();
    globalThis.fetch = jest.fn(async (url: RequestInfo) => {
      if (String(url).includes('skip=20')) {
        return jsonResponse(
          page([product({ id: 2, title: 'Case' })], {
            total: 40,
            skip: 20,
            limit: 20,
          }),
        );
      }

      if (String(url).includes('products')) {
        return jsonResponse(page([product()], { total: 40, skip: 0, limit: 20 }));
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: { get: () => 'image/jpeg' },
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }) as unknown as typeof fetch;

    const first = await store.dispatch(
      catalogApi.endpoints.getProducts.initiate({ limit: 20, skip: 0 }),
    );
    const second = await store.dispatch(
      catalogApi.endpoints.getProducts.initiate({ limit: 20, skip: 20 }),
    );

    expect(first).toEqual(
      expect.objectContaining({ status: 'fulfilled' }),
    );
    expect(second).toEqual(
      expect.objectContaining({ status: 'fulfilled' }),
    );
    const cached = catalogApi.endpoints.getProducts.select({
      limit: 20,
      skip: 0,
    })(store.getState());
    expect(cached.data?.products.map(item => item.id)).toEqual([1, 2]);
    expect(repository.readProducts()).toHaveLength(2);
    expect(repository.readLatestFeed()?.endpoint).toBe('getProducts');
  });

  it('filters a search to the selected category', async () => {
    const { store } = createTestStore();
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        page([
          product({ id: 1, category: 'smartphones' }),
          product({ id: 2, category: 'laptops', title: 'Laptop' }),
        ]),
      ),
    );

    await store.dispatch(
      catalogApi.endpoints.searchProducts.initiate({
        q: 'phone',
        limit: 20,
        skip: 0,
        category: 'smartphones',
        sortBy: 'price',
        order: 'desc',
      }),
    );

    const cached = catalogApi.endpoints.searchProducts.select({
      q: 'phone',
      limit: 20,
      skip: 0,
      category: 'smartphones',
      sortBy: 'price',
      order: 'desc',
    })(store.getState());

    expect(cached.data?.products.map(item => item.id)).toEqual([1]);
    const calls = (globalThis.fetch as jest.Mock).mock.calls as unknown[][];
    expect(String(calls[0][0])).toContain('products/search');
    expect(String(calls[0][0])).toContain('sortBy=price');
  });

  it('reports request and cache failures without dropping the result', async () => {
    const { store, repository } = createTestStore();
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('offline'));

    const failed = await store.dispatch(
      catalogApi.endpoints.getProducts.initiate({ limit: 20, skip: 0 }),
    );
    expect(failed).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ error: 'offline' }),
      }),
    );

    globalThis.fetch = jest.fn().mockRejectedValueOnce('bad');
    const fallback = await store.dispatch(
      catalogApi.endpoints.searchProducts.initiate({
        q: 'phone',
        limit: 20,
        skip: 0,
      }),
    );
    expect(fallback).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          error: 'Failed to search products',
        }),
      }),
    );

    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(page([product()])));
    repository.upsertProducts = () => {
      throw new Error('disk');
    };
    const saved = await store.dispatch(
      catalogApi.endpoints.getProducts.initiate({
        limit: 20,
        skip: 0,
        category: 'smartphones',
      }),
    );
    expect(saved).toEqual(expect.objectContaining({ status: 'fulfilled' }));

    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse([
        'beauty',
        { slug: 'laptops', name: 'Laptops', url: 'https://example.com' },
      ]),
    );
    await store.dispatch(catalogApi.endpoints.getCategories.initiate());
    expect(repository.readCategories()).toHaveLength(2);

    globalThis.fetch = jest.fn().mockRejectedValue(new Error('categories down'));
    const categories = await store.dispatch(
      catalogApi.endpoints.getCategories.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    expect(categories).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ error: 'categories down' }),
      }),
    );

    repository.upsertCategories = () => {
      throw new Error('disk');
    };
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(['beauty']));
    const cachedCategories = await store.dispatch(
      catalogApi.endpoints.getCategories.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    expect(cachedCategories).toEqual(
      expect.objectContaining({ status: 'fulfilled' }),
    );
  });
});
