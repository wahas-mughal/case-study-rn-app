import Realm from 'realm';

import { openCatalogRepository } from './realm';
import { product } from '../../test/product';

type TestRealm = {
  create: (name: string, value: Record<string, unknown>) => void;
};

const realms = Realm as unknown as { latest: TestRealm };

describe('realm repository', () => {
  function open() {
    const repository = openCatalogRepository();
    return {
      repository,
      realm: realms.latest,
    };
  }

  it('stores products, categories, images, feeds, and the cart queue', () => {
    const { repository } = open();
    const first = product({ id: 1, brand: 'Acme' });
    const second = product({
      id: 2,
      title: 'Case',
      brand: undefined,
      images: [],
    });

    repository.upsertProducts([first]);
    repository.upsertProducts([
      product({ id: 1, title: 'Phone updated', brand: 'Acme' }),
    ]);
    repository.upsertProducts([second]);
    repository.upsertCategories([
      { slug: 'smartphones', name: 'Smartphones', url: 'https://example.com' },
    ]);
    repository.saveImage('https://example.com/thumb.jpg', 'data:image/jpeg,abc');
    repository.saveFeed({
      endpoint: 'getProducts',
      args: { limit: 20, skip: 0 },
      productIds: [1],
      total: 1,
      skip: 0,
      limit: 20,
    });
    repository.enqueueAction({
      id: 'later',
      type: 'addToCart',
      productId: 1,
      quantity: 1,
      createdAt: new Date('2026-01-02'),
    });
    repository.enqueueAction({
      id: 'sooner',
      type: 'addToCart',
      productId: 2,
      quantity: 1,
      createdAt: new Date('2026-01-01'),
    });

    expect(repository.readProduct(1)?.title).toBe('Phone updated');
    expect(repository.readProduct(1)?.brand).toBe('Acme');
    expect(repository.readProduct(2)?.brand).toBeUndefined();
    expect(repository.readProduct(9)).toBeNull();
    expect(repository.readProducts()).toHaveLength(2);
    expect(repository.readCategories()[0].slug).toBe('smartphones');
    expect(repository.readImage('https://example.com/thumb.jpg')).toBe(
      'data:image/jpeg,abc',
    );
    expect(repository.readImage('missing')).toBeNull();
    expect(repository.readLatestFeed()?.productIds).toEqual([1]);
    expect(repository.readQueuedActions().map(action => action.id)).toEqual([
      'sooner',
      'later',
    ]);

    repository.deleteQueuedAction('missing');
    repository.deleteQueuedAction('sooner');
    expect(repository.readQueuedActions()).toHaveLength(1);
  });

  it('skips feed and image rows that cannot be read', () => {
    const { repository, realm } = open();

    expect(repository.readLatestFeed()).toBeNull();

    realm.create('FeedSnapshot', {
      queryKey: 'bad-endpoint',
      endpoint: 'other',
      argsJson: '{}',
      productIdsJson: '[]',
      total: 0,
      skip: 0,
      limit: 0,
      updatedAt: new Date('2026-02-01'),
    });
    expect(repository.readLatestFeed()).toBeNull();

    realm.create('FeedSnapshot', {
      queryKey: 'bad-json',
      endpoint: 'searchProducts',
      argsJson: '{',
      productIdsJson: '{',
      total: 0,
      skip: 0,
      limit: 0,
      updatedAt: new Date('2026-02-02'),
    });
    expect(repository.readLatestFeed()).toBeNull();

    realm.create('FeedSnapshot', {
      queryKey: 'bad-args',
      endpoint: 'getProducts',
      argsJson: 'null',
      productIdsJson: '[1, "nope"]',
      total: 1,
      skip: 0,
      limit: 20,
      updatedAt: new Date('2026-02-03'),
    });
    expect(repository.readLatestFeed()).toBeNull();

    realm.create('FeedSnapshot', {
      queryKey: 'bad-ids',
      endpoint: 'getProducts',
      argsJson: JSON.stringify({ limit: 20, skip: 0 }),
      productIdsJson: '[1, "nope"]',
      total: 0,
      skip: 0,
      limit: 20,
      updatedAt: new Date('2026-02-03T01:00:00Z'),
    });
    expect(repository.readLatestFeed()?.productIds).toEqual([1]);

    realm.create('FeedSnapshot', {
      queryKey: 'broken-ids',
      endpoint: 'getProducts',
      argsJson: JSON.stringify({ limit: 20, skip: 0 }),
      productIdsJson: '{',
      total: 0,
      skip: 0,
      limit: 20,
      updatedAt: new Date('2026-02-03T02:00:00Z'),
    });
    expect(repository.readLatestFeed()?.productIds).toEqual([]);

    realm.create('Product', {
      id: 5,
      title: 'Broken',
      description: '',
      category: 'smartphones',
      price: 1,
      rating: 1,
      thumbnail: 'thumb',
      brand: null,
      stock: 1,
      imagesJson: '{',
    });
    expect(repository.readProduct(5)?.images).toEqual([]);

    realm.create('Product', {
      id: 6,
      title: 'Mixed',
      description: '',
      category: 'smartphones',
      price: 1,
      rating: 1,
      thumbnail: 'thumb',
      brand: null,
      stock: 1,
      imagesJson: '[1, "ok"]',
    });
    expect(repository.readProduct(6)?.images).toEqual(['ok']);

    realm.create('Product', {
      id: 7,
      title: 'Object',
      description: '',
      category: 'smartphones',
      price: 1,
      rating: 1,
      thumbnail: 'thumb',
      brand: null,
      stock: 1,
      imagesJson: '{"a":1}',
    });
    expect(repository.readProduct(7)?.images).toEqual([]);

    realm.create('FeedSnapshot', {
      queryKey: 'good',
      endpoint: 'searchProducts',
      argsJson: JSON.stringify({ limit: 20, skip: 0, q: 'phone' }),
      productIdsJson: '[]',
      total: 0,
      skip: 0,
      limit: 20,
      updatedAt: new Date('2026-02-04'),
    });
    expect(repository.readLatestFeed()?.endpoint).toBe('searchProducts');
  });
});
