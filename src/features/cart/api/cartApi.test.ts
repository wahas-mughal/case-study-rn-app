import { cartApi, hasQueuedAdd, startCartSync } from './cartApi';
import { setOnline } from '../../network';
import { createMemoryRepository } from '../../../test/memoryRepository';
import { createTestStore } from '../../../test/store';
import { setRepository } from '../../../shared/db/repository';

function cartResponse(ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ id: 8 }),
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

describe('cart queue', () => {
  it('treats a closed repository as no queued add', () => {
    setRepository({
      ...createMemoryRepository(),
      readQueuedActions() {
        throw new Error('closed');
      },
    });

    expect(hasQueuedAdd(1)).toBe(false);
  });

  it('posts an online add and keeps a failed one queued', async () => {
    const { store, repository } = createTestStore();
    globalThis.fetch = jest.fn().mockResolvedValue(cartResponse());

    const added = await store
      .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 4 }))
      .unwrap();

    expect(added).toEqual({ queued: false, id: 8 });
    expect(repository.readQueuedActions()).toHaveLength(0);
    expect(hasQueuedAdd(4)).toBe(false);

    globalThis.fetch = jest.fn().mockResolvedValue(cartResponse(false));
    const queued = await store
      .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 5 }))
      .unwrap();

    expect(queued).toEqual({ queued: true });
    expect(hasQueuedAdd(5)).toBe(true);

    const again = await store
      .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 5 }))
      .unwrap();
    expect(again.queued).toBe(true);
    expect(repository.readQueuedActions()).toHaveLength(1);
  });

  it('queues while offline and flushes after reconnect', async () => {
    const { store, repository } = createTestStore();
    store.dispatch(setOnline(false));
    globalThis.fetch = jest.fn().mockResolvedValue(cartResponse());

    const queued = await store
      .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 6 }))
      .unwrap();

    expect(queued).toEqual({ queued: true });
    expect(globalThis.fetch).not.toHaveBeenCalled();

    store.dispatch(setOnline(true));
    const flushed = await store
      .dispatch(cartApi.endpoints.flushQueue.initiate())
      .unwrap();

    expect(flushed).toEqual({ flushed: 1 });
    expect(repository.readQueuedActions()).toHaveLength(0);
    expect(store.getState().network.status).toBe('online');
  });

  it('stops flushing at the first failed post', async () => {
    const { store, repository } = createTestStore();
    repository.enqueueAction({
      id: 'a',
      type: 'addToCart',
      productId: 1,
      quantity: 1,
      createdAt: new Date('2026-01-01'),
    });
    repository.enqueueAction({
      id: 'b',
      type: 'addToCart',
      productId: 2,
      quantity: 1,
      createdAt: new Date('2026-01-02'),
    });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(cartResponse())
      .mockResolvedValueOnce(cartResponse(false));

    let resolveFetch: (value: unknown) => void = () => undefined;
    globalThis.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve;
        }),
    );

    const pending = store.dispatch(cartApi.endpoints.flushQueue.initiate());
    await Promise.resolve();
    expect(store.getState().network.status).toBe('syncing');

    resolveFetch(cartResponse(false));
    await pending;

    expect(repository.readQueuedActions().map(action => action.id)).toEqual([
      'a',
      'b',
    ]);
    expect(store.getState().network.status).toBe('online');
  });

  it('leaves the banner alone when the queue is empty', async () => {
    const { store } = createTestStore();

    await store.dispatch(cartApi.endpoints.flushQueue.initiate());

    expect(store.getState().network.status).toBe('online');
  });

  it('flushes on startup and when the device comes back online', async () => {
    const repository = createMemoryRepository();
    repository.enqueueAction({
      id: 'a',
      type: 'addToCart',
      productId: 1,
      quantity: 1,
      createdAt: new Date('2026-01-01'),
    });
    const { store } = createTestStore(repository);
    store.dispatch(setOnline(false));
    globalThis.fetch = jest.fn().mockResolvedValue(cartResponse());

    const stop = startCartSync(store);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    store.dispatch(setOnline(false));
    store.dispatch(setOnline(true));

    await store.dispatch(cartApi.endpoints.flushQueue.initiate()).unwrap();
    expect(repository.readQueuedActions()).toHaveLength(0);

    store.dispatch(setOnline(false));
    stop();
  });
});
