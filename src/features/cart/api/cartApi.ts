import type { AppDispatch, RootState } from '../../../app/store/store';
import { request } from '../../../shared/api/client';
import { buildAddToCartUrl } from '../../../shared/api/url';
import { baseApi } from '../../../shared/api/baseApi';
import { getRepository } from '../../../shared/db/repository';
import { setSyncing } from '../../network';

const CART_USER_ID = 1;
const FLUSH_CACHE_KEY = 'cart-queue';

type AddToCartArgs = {
  productId: number;
};

type AddToCartResult = {
  queued: boolean;
  id?: number;
};

type CartResponse = {
  id: number;
};

type SyncStore = {
  getState: () => RootState;
  dispatch: AppDispatch;
  subscribe: (listener: () => void) => () => void;
};

function isOnline(state: RootState): boolean {
  return state.network.online && state.network.status !== 'syncing';
}

async function postCart(productId: number, quantity: number) {
  return request<CartResponse>(buildAddToCartUrl(), {
    method: 'POST',
    body: {
      userId: CART_USER_ID,
      products: [{ id: productId, quantity }],
    },
  });
}

function queuedAdd(productId: number) {
  return getRepository()
    .readQueuedActions()
    .find(
      action => action.type === 'addToCart' && action.productId === productId,
    );
}

export function hasQueuedAdd(productId: number): boolean {
  try {
    return queuedAdd(productId) !== undefined;
  } catch {
    return false;
  }
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    addToCart: builder.mutation<AddToCartResult, AddToCartArgs>({
      queryFn: async ({ productId }, api) => {
        const repository = getRepository();
        const existing = queuedAdd(productId);

        if (!existing) {
          repository.enqueueAction({
            id: `${productId}-${Date.now()}`,
            type: 'addToCart',
            productId,
            quantity: 1,
            createdAt: new Date(),
          });
        }

        const action = queuedAdd(productId);

        if (!action || !isOnline(api.getState() as RootState)) {
          return { data: { queued: true } };
        }

        try {
          const response = await postCart(action.productId, action.quantity);
          repository.deleteQueuedAction(action.id);
          return { data: { queued: false, id: response.id } };
        } catch {
          return { data: { queued: true } };
        }
      },
    }),
    flushQueue: builder.mutation<{ flushed: number }, void>({
      queryFn: async () => {
        const repository = getRepository();
        let flushed = 0;

        while (true) {
          const pending = repository.readQueuedActions();

          if (pending.length === 0) {
            break;
          }

          let progressed = false;

          for (const action of pending) {
            try {
              await postCart(action.productId, action.quantity);
              repository.deleteQueuedAction(action.id);
              flushed += 1;
              progressed = true;
            } catch {
              return { data: { flushed } };
            }
          }

          if (!progressed) {
            break;
          }
        }

        return { data: { flushed } };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        if (getRepository().readQueuedActions().length === 0) {
          return;
        }

        dispatch(setSyncing(true));

        try {
          await queryFulfilled;
        } finally {
          dispatch(setSyncing(false));
        }
      },
    }),
  }),
});

export function useAddToCartMutation(productId: number) {
  return cartApi.useAddToCartMutation({
    fixedCacheKey: `add-to-cart-${productId}`,
  });
}

export function startCartSync(store: SyncStore) {
  let online = store.getState().network.online;

  const flush = () => {
    store.dispatch(
      cartApi.endpoints.flushQueue.initiate(undefined, {
        fixedCacheKey: FLUSH_CACHE_KEY,
      }),
    );
  };

  if (online) {
    flush();
  }

  return store.subscribe(() => {
    const nextOnline = store.getState().network.online;

    if (nextOnline === online) {
      return;
    }

    const becameOnline = nextOnline && !online;
    online = nextOnline;

    if (becameOnline) {
      flush();
    }
  });
}
