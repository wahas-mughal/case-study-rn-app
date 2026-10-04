import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import { API_BASE_URL } from '../../../shared/api/client';
import { setOnline } from '../model/networkSlice';

type NetworkDispatch = (action: ReturnType<typeof setOnline>) => void;

const CHECK_MS = 1000;
const PROBE_TIMEOUT_MS = 2000;

function probeOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  return fetch(`${API_BASE_URL}?reachability=${Date.now()}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    signal: controller.signal,
  })
    .then(() => true)
    .catch(() => false)
    .finally(() => clearTimeout(timer));
}

export function listenToNetwork(dispatch: NetworkDispatch) {
  let probing = false;
  let pending = false;

  const probe = () => {
    if (probing) {
      pending = true;
      return;
    }

    probing = true;
    probeOnline()
      .then(online => {
        dispatch(setOnline(online));
      })
      .finally(() => {
        probing = false;

        if (!pending) {
          return;
        }

        pending = false;
        probe();
      });
  };

  probe();
  const timer = setInterval(probe, CHECK_MS);
  const unsubscribe = NetInfo.addEventListener(() => {
    probe();
  });
  const appState = AppState.addEventListener('change', next => {
    if (next === 'active') {
      probe();
    }
  });

  return () => {
    clearInterval(timer);
    unsubscribe();
    appState.remove();
  };
}
