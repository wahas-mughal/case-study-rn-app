import { Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';

import { useDebouncedValue } from './useDebouncedValue';

function Probe({ value, delay }: { value: string; delay: number }) {
  const debounced = useDebouncedValue(value, delay);
  return <Text>{debounced}</Text>;
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits out the delay before publishing the next value', async () => {
    const view = await render(<Probe value="ph" delay={400} />);

    await view.rerender(<Probe value="phone" delay={400} />);
    expect(screen.getByText('ph')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.getByText('phone')).toBeTruthy();
  });
});
