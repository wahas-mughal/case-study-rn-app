import { API_BASE_URL, request } from '../../../shared/api/client';
import { getRepository } from '../../../shared/db/repository';
import {
  buildCategoriesUrl,
  buildProductSearchUrl,
  buildProductsUrl,
} from '../../../shared/api/url';
import { baseApi } from '../../../shared/api/baseApi';
import type {
  Category,
  Product,
  ProductSearchQuery,
  ProductsPage,
  ProductsQuery,
} from '../model/types';

type CategoryResponse =
  | string
  | {
      slug: string;
      name: string;
      url: string;
    };

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

export function toCategories(response: CategoryResponse[]): Category[] {
  return response.map(category => {
    if (typeof category === 'string') {
      return {
        slug: category,
        name: category,
        url: `${API_BASE_URL}products/category/${encodeURIComponent(category)}`,
      };
    }

    return {
      slug: category.slug,
      name: category.name,
      url: category.url,
    };
  });
}

async function cacheProducts(queryFulfilled: Promise<{ data: ProductsPage }>) {
  try {
    const { data } = await queryFulfilled;
    getRepository().upsertProducts(data.products);
  } catch {
    // A failed cache write must not replace the query result.
  }
}

function queryError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return { error: { status: 'CUSTOM_ERROR' as const, error: message } };
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
          return queryError(error, 'Failed to fetch products');
        }
      },
      async onQueryStarted(_query, { queryFulfilled }) {
        await cacheProducts(queryFulfilled);
      },
    }),
    searchProducts: builder.query<ProductsPage, ProductSearchQuery>({
      queryFn: async query => {
        try {
          const response = await request<ProductsResponse>(
            buildProductSearchUrl(query),
          );
          return { data: toProductsPage(response) };
        } catch (error) {
          return queryError(error, 'Failed to search products');
        }
      },
      async onQueryStarted(_query, { queryFulfilled }) {
        await cacheProducts(queryFulfilled);
      },
    }),
    getCategories: builder.query<Category[], void>({
      queryFn: async () => {
        try {
          const response = await request<CategoryResponse[]>(
            buildCategoriesUrl(),
          );
          return { data: toCategories(response) };
        } catch (error) {
          return queryError(error, 'Failed to fetch categories');
        }
      },
      async onQueryStarted(_query, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          getRepository().upsertCategories(data);
        } catch {
          // A failed cache write must not replace the query result.
        }
      },
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useSearchProductsQuery,
} = catalogApi;
