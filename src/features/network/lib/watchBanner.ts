import { setBannerVisible } from '../model/networkSlice';
import type { NetworkStatus } from '../model/networkSlice';

const ONLINE_BANNER_MS = 2000;

type BannerStore = {
  getState: () => { network: { status: NetworkStatus } };
  dispatch: (action: ReturnType<typeof setBannerVisible>) => void;
  subscribe: (listener: () => void) => () => void;
};

export function watchBanner(store: BannerStore) {
  let status = store.getState().network.status;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const apply = (next: NetworkStatus) => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }

    store.dispatch(setBannerVisible(true));

    if (next !== 'online') {
      return;
    }

    timer = setTimeout(() => {
      store.dispatch(setBannerVisible(false));
    }, ONLINE_BANNER_MS);
  };

  apply(status);

  return store.subscribe(() => {
    const next = store.getState().network.status;

    if (next === status) {
      return;
    }

    status = next;
    apply(next);
  });
}
