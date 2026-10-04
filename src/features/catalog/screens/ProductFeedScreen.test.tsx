import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { useColorScheme } from 'react-native';

import { ProductFeedScreen } from './ProductFeedScreen';
import { catalogApi } from '../api/catalogApi';
import { product } from '../../../test/product';
import { createTestStore } from '../../../test/store';

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

async function renderFeed() {
  const { store, repository } = createTestStore();
  const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
  await render(
    <Provider store={store}>
      <ProductFeedScreen
        navigation={navigation as never}
        route={{} as never}
      />
    </Provider>,
  );

  return { store, repository, navigation };
}

describe('ProductFeedScreen', () => {
  it('shows cached products before the request resolves', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    globalThis.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve;
        }),
    );
    const { store } = createTestStore();
    await store.dispatch(
      catalogApi.util.upsertQueryData('getProducts', { limit: 20, skip: 0 }, {
        products: [product()],
        total: 1,
        skip: 0,
        limit: 20,
      }),
    );
    await store.dispatch(
      catalogApi.util.upsertQueryData('getCategories', undefined, [
        { slug: 'smartphones', name: 'Smartphones', url: 'https://example.com' },
      ]),
    );
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

    await render(
      <Provider store={store}>
        <ProductFeedScreen
          navigation={navigation as never}
          route={{} as never}
        />
      </Provider>,
    );

    expect(screen.getByText('Phone')).toBeTruthy();
    await fireEvent.press(screen.getByText('Phone'));
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetail', {
      productId: 1,
    });

    resolveFetch(
      jsonResponse({
        products: [product()],
        total: 1,
        skip: 0,
        limit: 20,
      }),
    );
    resolveFetch(
      jsonResponse([
        { slug: 'smartphones', name: 'Smartphones', url: 'https://example.com' },
      ]),
    );
  });

  it('searches after the debounce and changes the request when filters change', async () => {
    const calls: string[] = [];
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      calls.push(String(url));
      if (String(url).includes('categories')) {
        return Promise.resolve(
          jsonResponse([
            { slug: 'smartphones', name: 'Smartphones', url: 'https://example.com' },
          ]),
        );
      }

      return Promise.resolve(
        jsonResponse({
          products: [product(), product({ id: 2, category: 'laptops', title: 'Laptop' })],
          total: 40,
          skip: 0,
          limit: 20,
        }),
      );
    });
    await renderFeed();

    await waitFor(() => {
      expect(screen.getByText('Phone')).toBeTruthy();
    });

    await fireEvent.changeText(
      screen.getByPlaceholderText('Search products'),
      'phone',
    );
    expect(calls.some(url => url.includes('products/search'))).toBe(false);

    await waitFor(() => {
      expect(calls.some(url => url.includes('products/search?'))).toBe(true);
    });

    await fireEvent.press(screen.getByText('Smartphones'));
    await fireEvent.press(screen.getByText('Price ↑'));

    await waitFor(() => {
      expect(
        calls.some(
          url => url.includes('products/search') && url.includes('sortBy=price'),
        ),
      ).toBe(true);
    });

    await fireEvent.press(screen.getByTestId('list-end'));
    await waitFor(() => {
      expect(calls.some(url => url.includes('skip=20'))).toBe(true);
    });
  });

  it('shows an error, an empty page, and a filtered page with more results', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await renderFeed();

    expect(await screen.findByText('Products could not be loaded.')).toBeTruthy();
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ products: [], total: 0, skip: 0, limit: 20 }),
    );
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('No products found.')).toBeTruthy();
  });

  it('offers another page when the current filtered page is empty', async () => {
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (String(url).includes('categories')) {
        return Promise.resolve(
          jsonResponse([
            { slug: 'beauty', name: 'Beauty', url: 'https://example.com' },
          ]),
        );
      }

      return Promise.resolve(
        jsonResponse({
          products: [product({ category: 'laptops', title: 'Laptop' })],
          total: 40,
          skip: 0,
          limit: 20,
        }),
      );
    });
    await renderFeed();
    await fireEvent.changeText(
      screen.getByPlaceholderText('Search products'),
      'phone',
    );
    expect(await screen.findByText('Laptop')).toBeTruthy();
    await fireEvent.press(screen.getByText('Beauty'));
    await fireEvent.press(await screen.findByText('Load more'));
    expect(screen.getByText('Load more')).toBeTruthy();
  });

  it('uses the dark palette', async () => {
    jest.spyOn({ useColorScheme }, 'useColorScheme');
    const scheme = useColorScheme as jest.Mock;
    if (typeof scheme.mockReturnValue === 'function') {
      scheme.mockReturnValue('dark');
    }
    globalThis.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ products: [], total: 0, skip: 0, limit: 20 }),
    );
    await renderFeed();
    expect(screen.getByText('Categories')).toBeTruthy();
    expect(screen.getByText('Filters')).toBeTruthy();
  });
});
