import { request } from '../../../shared/api/client';
import { buildProductsUrl } from '../../../shared/api/url';
import { baseApi } from '../../../shared/api/baseApi';
import type { Product, ProductsPage, ProductsQuery } from '../model/types';

type ProductResponse = Product & {
  brand?: string | null;
  images?: string[];
};

type ProductsResponse = {
  products: ProductResponse[];
  total: number;
  skip: number;
  limit: number;
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

export function toProductsPage(response: ProductsResponse): ProductsPage {
  return {
    products: response.products.map(toProduct),
    total: response.total,
    skip: response.skip,
    limit: response.limit,
  };
}

const catalogApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getProducts: builder.query<ProductsPage, ProductsQuery>({
      queryFn: async query => {
        try {
          const response = await request<ProductsResponse>(
            buildProductsUrl(query),
          );
          return { data: toProductsPage(response) };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch products';
          return { error: { status: 'CUSTOM_ERROR', error: message } };
        }
      },
    }),
  }),
});

export const { useGetProductsQuery } = catalogApi;
