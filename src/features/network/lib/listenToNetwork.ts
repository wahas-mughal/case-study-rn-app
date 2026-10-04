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

export function listenToNetwork(dispatch: NetworkDispatch) {
  const publish = (state: NetInfoState) => {
    const online = readOnline(state);

    if (online === null) {
      return;
    }

    dispatch(setOnline(online));
  };

  const refresh = () => {
    NetInfo.refresh()
      .then(state => {
        publish(state);

        if (readOnline(state) !== false) {
          return;
        }

        // The first check after returning to the app can still report offline.
        setTimeout(() => {
          NetInfo.refresh()
            .then(publish)
            .catch(() => undefined);
        }, 1000);
      })
      .catch(() => undefined);
  };

  refresh();

  const unsubscribe = NetInfo.addEventListener(publish);
  const appState = AppState.addEventListener('change', next => {
    if (next === 'active') {
      refresh();
    }
  });

  return () => {
    unsubscribe();
    appState.remove();
  };
}
