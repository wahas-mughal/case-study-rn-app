import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NetworkStatus = 'online' | 'offline' | 'syncing';

export type NetworkState = {
  online: boolean;
  status: NetworkStatus;
};

const initialState: NetworkState = {
  online: true,
  status: 'online',
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
  },
});

export const { setOnline, setSyncing } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;
