import { request } from '../../../shared/api/client';
import { getRepository } from '../../../shared/db/repository';
import { buildProductUrl } from '../../../shared/api/url';
import { baseApi } from '../../../shared/api/baseApi';
import type { Product } from '../../catalog';

type ProductResponse = Product & {
  brand?: string | null;
  images?: string[];
};

function toProduct(product: ProductResponse): Product {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    rating: product.rating,
    thumbnail: product.thumbnail,
    brand: product.brand ?? undefined,
    stock: product.stock,
    images: product.images ?? [],
  };
}

function queryError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return { error: { status: 'CUSTOM_ERROR' as const, error: message } };
}

export const productDetailApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getProduct: builder.query<Product, number>({
      queryFn: async id => {
        try {
          const response = await request<ProductResponse>(buildProductUrl(id));
          return { data: toProduct(response) };
        } catch (error) {
          return queryError(error, 'Failed to fetch product');
        }
      },
      async onQueryStarted(_id, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          getRepository().upsertProducts([data]);
        } catch {
          // A failed cache write must not replace the query result.
        }
      },
    }),
  }),
});

export function useGetProductQuery(id: number) {
  return productDetailApi.useGetProductQuery(id, {
    refetchOnMountOrArgChange: true,
  });
}
