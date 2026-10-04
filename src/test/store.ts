import { configureStore } from '@reduxjs/toolkit';

import { networkReducer } from '../features/network';
import { baseApi } from '../shared/api/baseApi';
import {
  setRepository,
  type CatalogRepository,
} from '../shared/db/repository';
import { createMemoryRepository } from './memoryRepository';

export function createTestStore(
  repository: CatalogRepository = createMemoryRepository(),
) {
  setRepository(repository);

  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      network: networkReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return { store, repository };
}
