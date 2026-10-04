import { act, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { Pressable, Text } from 'react-native';

import { NetworkBanner } from './NetworkBanner';
import { setBannerVisible, setOnline, setSyncing } from '../model/networkSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { createTestStore } from '../../../test/store';

function StatusProbe() {
  const dispatch = useAppDispatch();
  const online = useAppSelector(state => state.network.online);

  return (
    <Pressable onPress={() => dispatch(setOnline(!online))}>
      <Text>{online ? 'connected' : 'disconnected'}</Text>
    </Pressable>
  );
}

describe('NetworkBanner', () => {
  it('follows the shared status', async () => {
    const { store } = createTestStore();
    const view = await render(
      <Provider store={store}>
        <NetworkBanner />
        <StatusProbe />
      </Provider>,
    );

    expect(screen.getByText('Online')).toBeTruthy();
    expect(screen.getByText('connected')).toBeTruthy();

    await act(async () => {
      store.dispatch(setOnline(false));
    });
    expect(screen.getByText('Offline - Serving Cached Data')).toBeTruthy();

    await act(async () => {
      store.dispatch(setSyncing(true));
    });
    expect(screen.getByText('Syncing Queued Actions')).toBeTruthy();

    await act(async () => {
      store.dispatch(setBannerVisible(false));
    });
    expect(screen.queryByText('Syncing Queued Actions')).toBeNull();

    await view.unmount();
  });
});
