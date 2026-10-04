import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import { API_BASE_URL } from '../../../shared/api/client';
import { setOnline } from '../model/networkSlice';

type NetworkDispatch = (action: ReturnType<typeof setOnline>) => void;

function readOnline(state: NetInfoState): boolean | null {
  if (state.isConnected === true || state.isInternetReachable === true) {
    return true;
  }

  if (state.isConnected === null && state.isInternetReachable === null) {
    return null;
  }

  return false;
}

const OFFLINE_CHECK_MS = 1000;
const PROBE_TIMEOUT_MS = 2000;

function probeOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  return fetch(API_BASE_URL, { method: 'GET', signal: controller.signal })
    .then(() => true)
    .catch(() => false)
    .finally(() => clearTimeout(timer));
}

export function listenToNetwork(dispatch: NetworkDispatch) {
  let offlineTimer: ReturnType<typeof setInterval> | undefined;
  let probing = false;

  const stopOfflineCheck = () => {
    if (!offlineTimer) {
      return;
    }

    clearInterval(offlineTimer);
    offlineTimer = undefined;
  };

  const markOnline = () => {
    stopOfflineCheck();
    dispatch(setOnline(true));
  };

  const probe = () => {
    if (probing) {
      return;
    }

    probing = true;
    probeOnline()
      .then(online => {
        if (online) {
          markOnline();
        }
      })
      .finally(() => {
        probing = false;
      });
  };

  const refresh = () => {
    NetInfo.refresh()
      .then(publish)
      .catch(() => undefined);
  };

  const publish = (state: NetInfoState) => {
    const online = readOnline(state);

    if (online === null) {
      return;
    }

    dispatch(setOnline(online));

    if (online) {
      stopOfflineCheck();
      return;
    }

    probe();

    if (offlineTimer) {
      return;
    }

    offlineTimer = setInterval(probe, OFFLINE_CHECK_MS);
  };

  refresh();

  const unsubscribe = NetInfo.addEventListener(publish);
  const appState = AppState.addEventListener('change', next => {
    if (next === 'active') {
      refresh();
    }
  });

  return () => {
    stopOfflineCheck();
    unsubscribe();
    appState.remove();
  };
}
