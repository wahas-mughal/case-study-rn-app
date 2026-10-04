import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { RootNavigator } from './RootNavigator';
import { createTestStore } from '../../test/store';

describe('RootNavigator', () => {
  it('shows the product feed and the network banner', async () => {
    const { store } = createTestStore();
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ products: [], total: 0, skip: 0, limit: 20 }),
      headers: { get: () => 'application/json' },
      arrayBuffer: async () => new ArrayBuffer(0),
    });

    await render(
      <Provider store={store}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </Provider>,
    );

    expect(await screen.findByText('Online')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search products')).toBeTruthy();
  });
});
