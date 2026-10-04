import { networkReducer, setOnline, setSyncing } from './networkSlice';
import {
  selectBannerMessage,
  selectBannerVisible,
  selectNetworkStatus,
} from './banner';

describe('network status', () => {
  it('keeps syncing in place while connectivity changes', () => {
    const offline = networkReducer(undefined, setOnline(false));
    expect(offline).toMatchObject({ online: false, status: 'offline' });

    const syncing = networkReducer(offline, setSyncing(true));
    const stillSyncing = networkReducer(syncing, setOnline(true));

    expect(stillSyncing.status).toBe('syncing');
    expect(stillSyncing.online).toBe(true);
    expect(networkReducer(stillSyncing, setSyncing(false)).status).toBe(
      'online',
    );
    expect(
      networkReducer({ ...stillSyncing, online: false }, setSyncing(false))
        .status,
    ).toBe('offline');
  });

  it('selects the banner copy', () => {
    const online = networkReducer(undefined, { type: 'unknown' });

    expect(selectNetworkStatus({ network: online })).toBe('online');
    expect(selectBannerVisible({ network: online })).toBe(true);
    expect(selectBannerMessage({ network: online })).toBe('Online');
    expect(
      selectBannerMessage({
        network: { ...online, status: 'offline' },
      }),
    ).toBe('Offline - Serving Cached Data');
    expect(
      selectBannerMessage({
        network: { ...online, status: 'syncing' },
      }),
    ).toBe('Syncing Queued Actions');
  });
});
