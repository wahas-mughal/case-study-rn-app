import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { productDetailApi } from '../api/productDetailApi';
import { ProductDetailScreen } from './ProductDetailScreen';
import { product } from '../../../test/product';
import { createTestStore } from '../../../test/store';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

async function renderDetail(
  store: ReturnType<typeof createTestStore>['store'],
  productId = 1,
) {
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
  await render(
    <Provider store={store}>
      <ProductDetailScreen
        navigation={navigation as never}
        route={{ params: { productId } } as never}
      />
    </Provider>,
  );
  return navigation;
}

describe('ProductDetailScreen', () => {
  it('shows a seeded product and adds it to the cart', async () => {
    const { store, repository } = createTestStore();
    await store.dispatch(
      productDetailApi.util.upsertQueryData(
        'getProduct',
        1,
        product({ brand: 'Acme' }),
      ),
    );
    globalThis.fetch = jest.fn(async (_url: RequestInfo, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return jsonResponse({ id: 3 });
      }

      return jsonResponse(product({ brand: 'Acme' }));
    }) as unknown as typeof fetch;
    const navigation = await renderDetail(store);

    expect(screen.getByText('Phone')).toBeTruthy();
    expect(screen.getByText('Acme')).toBeTruthy();
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Phone' });

    await fireEvent.press(screen.getByText('Add to cart'));
    expect(await screen.findByText('Added to cart')).toBeTruthy();
    expect(repository.readQueuedActions()).toHaveLength(0);
  });

  it('keeps a queued product locked and shows stock states', async () => {
    const { store, repository } = createTestStore();
    repository.enqueueAction({
      id: 'queued',
      type: 'addToCart',
      productId: 1,
      quantity: 1,
      createdAt: new Date(),
    });
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        product({ stock: 0, brand: undefined, images: [] }),
      ),
    );
    await renderDetail(store);

    expect(await screen.findByText('Added to cart')).toBeTruthy();
    expect(screen.getByText('Out of stock')).toBeTruthy();
  });

  it('lets the shopper retry a failed load', async () => {
    const { store } = createTestStore();
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({}, false));
    await renderDetail(store);

    expect(await screen.findByText('Product could not be loaded.')).toBeTruthy();
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse(product()));
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Phone')).toBeTruthy();
  });

  it('shows a spinner while the product is loading', async () => {
    const { store } = createTestStore();
    globalThis.fetch = jest.fn().mockImplementation(() => new Promise(() => undefined));
    const view = await render(
      <Provider store={store}>
        <ProductDetailScreen
          navigation={{ setOptions: jest.fn() } as never}
          route={{ params: { productId: 9 } } as never}
        />
      </Provider>,
    );

    expect(JSON.stringify(view.toJSON())).toContain('ActivityIndicator');
  });
});
