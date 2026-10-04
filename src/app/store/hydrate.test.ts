import { catalogApi } from '../../features/catalog/api/catalogApi';
import { product } from '../../test/product';
import { createTestStore } from '../../test/store';
import { hydrateCatalog } from './hydrate';

describe('hydrateCatalog', () => {
  it('copies categories, products, and the latest feed into the cache', async () => {
    const { store, repository } = createTestStore();
    const phone = product();
    repository.upsertCategories([
      { slug: 'smartphones', name: 'Smartphones', url: 'https://example.com' },
    ]);
    repository.upsertProducts([phone]);
    repository.saveFeed({
      endpoint: 'searchProducts',
      args: { limit: 20, skip: 0, q: 'phone' },
      productIds: [phone.id, 99],
      total: 2,
      skip: 0,
      limit: 20,
    });

    hydrateCatalog(store.dispatch);
    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });

    const queries = (
      store.getState() as { api: { queries: Record<string, { data?: unknown }> } }
    ).api.queries;
    expect(queries['getCategories(undefined)'].data).toEqual([
      { slug: 'smartphones', name: 'Smartphones', url: 'https://example.com' },
    ]);
    expect(queries['getProduct(1)'].data).toMatchObject({ title: 'Phone' });
    expect(queries['searchProducts(phone::::20)'].data).toMatchObject({
      products: [phone],
    });
  });

  it('hydrates a product list and ignores a feed that is not a query', async () => {
    const { store, repository } = createTestStore();
    repository.saveFeed({
      endpoint: 'searchProducts',
      args: { limit: 20, skip: 0 },
      productIds: [],
      total: 0,
      skip: 0,
      limit: 20,
    });
    hydrateCatalog(store.dispatch);
    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });
    const queries = (
      store.getState() as { api: { queries: Record<string, { data?: { products: unknown[] } }> } }
    ).api.queries;
    expect(queries['getProducts(:::20)'].data?.products).toEqual([]);

    repository.saveFeed({
      endpoint: 'getProducts',
      args: { limit: '20' } as never,
      productIds: [],
      total: 0,
      skip: 0,
      limit: 20,
    });
    hydrateCatalog(store.dispatch);
    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });
    const ignored = (
      store.getState() as { api: { queries: Record<string, unknown> } }
    ).api.queries;
    expect(ignored['getProducts("20")']).toBeUndefined();
  });

  it('does nothing when the cache is empty', async () => {
    const { store } = createTestStore();

    hydrateCatalog(store.dispatch);
    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });
    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });

    expect(
      catalogApi.endpoints.getCategories.select()(store.getState()).data,
    ).toBeUndefined();
  });
});
