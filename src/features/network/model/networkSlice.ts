import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NetworkStatus = 'online' | 'offline' | 'syncing';

export type NetworkState = {
  online: boolean;
  status: NetworkStatus;
  bannerVisible: boolean;
};

const initialState: NetworkState = {
  online: true,
  status: 'online',
  bannerVisible: true,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<boolean>) {
      state.online = action.payload;

      if (state.status === 'syncing') {
        return;
      }

      state.status = action.payload ? 'online' : 'offline';
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.status = action.payload
        ? 'syncing'
        : state.online
        ? 'online'
        : 'offline';
    },
    setBannerVisible(state, action: PayloadAction<boolean>) {
      state.bannerVisible = action.payload;
    },
  },
});

export const { setOnline, setSyncing, setBannerVisible } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;
