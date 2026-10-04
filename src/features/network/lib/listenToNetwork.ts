import NetInfo from '@react-native-community/netinfo';

import { setOnline } from '../model/networkSlice';

type NetworkDispatch = (action: ReturnType<typeof setOnline>) => void;

export function listenToNetwork(dispatch: NetworkDispatch) {
  const publish = (isConnected: boolean | null) => {
    if (isConnected === null) {
      return;
    }

    dispatch(setOnline(isConnected));
  };

  NetInfo.fetch().then(state => {
    publish(state.isConnected);
  });

  return NetInfo.addEventListener(state => {
    publish(state.isConnected);
  });
}
