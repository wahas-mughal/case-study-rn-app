import type { NetworkState, NetworkStatus } from './networkSlice';

type NetworkSliceState = {
  network: NetworkState;
};

export function selectNetworkStatus(state: NetworkSliceState): NetworkStatus {
  return state.network.status;
}

export function selectBannerVisible(state: NetworkSliceState): boolean {
  return state.network.bannerVisible;
}

export function selectBannerMessage(state: NetworkSliceState): string {
  switch (state.network.status) {
    case 'offline':
      return 'Offline - Serving Cached Data';
    case 'syncing':
      return 'Syncing Queued Actions';
    default:
      return 'Online';
  }
}
