import { watchBanner } from './watchBanner';
import { setBannerVisible } from '../model/networkSlice';
import type { NetworkStatus } from '../model/networkSlice';

function bannerStore(status: NetworkStatus) {
  const actions: unknown[] = [];
  let current = status;
  let listener: () => void = () => undefined;

  return {
    actions,
    setStatus(next: NetworkStatus) {
      current = next;
      listener();
    },
    getState: () => ({ network: { status: current } }),
    dispatch(action: unknown) {
      actions.push(action);
    },
    subscribe(next: () => void) {
      listener = next;
      return jest.fn();
    },
  };
}

describe('watchBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hides the online banner after two seconds', () => {
    const store = bannerStore('online');
    const stop = watchBanner(store);

    expect(store.actions).toContainEqual(setBannerVisible(true));
    jest.advanceTimersByTime(2000);
    expect(store.actions).toContainEqual(setBannerVisible(false));

    store.setStatus('online');
    store.setStatus('offline');
    expect(store.actions).toContainEqual(setBannerVisible(true));
    jest.advanceTimersByTime(2000);
    store.setStatus('syncing');
    store.setStatus('online');
    jest.advanceTimersByTime(2000);
    expect(store.actions).toContainEqual(setBannerVisible(false));
    stop();
  });

  it('keeps an offline banner visible', () => {
    const store = bannerStore('offline');
    watchBanner(store);

    jest.advanceTimersByTime(2000);
    expect(store.actions).toEqual([setBannerVisible(true)]);
  });
});
