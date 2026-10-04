import { request } from '../../../shared/api/client';
import { buildAddToCartUrl } from '../../../shared/api/url';
import { baseApi } from '../../../shared/api/baseApi';

const CART_USER_ID = 1;

type AddToCartArgs = {
  productId: number;
};

type AddToCartResponse = {
  id: number;
};

function queryError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return { error: { status: 'CUSTOM_ERROR' as const, error: message } };
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    addToCart: builder.mutation<AddToCartResponse, AddToCartArgs>({
      queryFn: async ({ productId }) => {
        try {
          const response = await request<AddToCartResponse>(
            buildAddToCartUrl(),
            {
              method: 'POST',
              body: {
                userId: CART_USER_ID,
                products: [{ id: productId, quantity: 1 }],
              },
            },
          );
          return { data: response };
        } catch (error) {
          return queryError(error, 'Failed to add product to cart');
        }
      },
    }),
  }),
});

export function useAddToCartMutation() {
  return cartApi.useAddToCartMutation();
}
