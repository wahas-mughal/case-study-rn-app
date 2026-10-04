jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };

  return {
    SafeAreaInsetsContext: React.createContext(insets),
    SafeAreaFrameContext: React.createContext(frame),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

import { render, screen } from '@testing-library/react-native';

import App from '../App';

test('renders the product feed', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ products: [], total: 0, skip: 0, limit: 20 }),
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  });

  await render(<App />);

  expect(await screen.findByText('Online')).toBeTruthy();
  expect(screen.getByPlaceholderText('Search products')).toBeTruthy();
});
