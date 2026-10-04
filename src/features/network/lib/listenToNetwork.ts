import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { AppState } from 'react-native';

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

export function listenToNetwork(dispatch: NetworkDispatch) {
  let offlineTimer: ReturnType<typeof setInterval> | undefined;

  const stopOfflineCheck = () => {
    if (!offlineTimer) {
      return;
    }

    clearInterval(offlineTimer);
    offlineTimer = undefined;
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

    if (offlineTimer) {
      return;
    }

    offlineTimer = setInterval(refresh, OFFLINE_CHECK_MS);
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
