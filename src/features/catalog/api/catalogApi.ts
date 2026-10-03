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

async function cacheProducts(
  queryFulfilled: Promise<{ data: ProductsPage }>,
  endpoint: 'getProducts' | 'searchProducts',
  args: ProductsQuery | ProductSearchQuery,
) {
  try {
    const { data } = await queryFulfilled;
    const repository = getRepository();
    repository.upsertProducts(data.products);
    repository.saveFeed({
      endpoint,
      args,
      productIds: data.products.map(product => product.id),
      total: data.total,
      skip: data.skip,
      limit: data.limit,
    });
  } catch {
    // A failed cache write must not replace the query result.
  }
}

function mergeProductPage(
  currentCache: ProductsPage,
  response: ProductsPage,
  skip: number,
) {
  if (skip === 0) {
    currentCache.products = response.products;
    currentCache.total = response.total;
    currentCache.skip = response.skip;
    currentCache.limit = response.limit;
    return;
  }

  currentCache.products.push(...response.products);
  currentCache.total = response.total;
  currentCache.skip = response.skip;
  currentCache.limit = response.limit;
}

function queryError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return { error: { status: 'CUSTOM_ERROR' as const, error: message } };
}

export const catalogApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getProducts: builder.query<ProductsPage, ProductsQuery>({
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}(${queryArgs.limit})`,
      merge: (currentCache, response, { arg }) => {
        mergeProductPage(currentCache, response, arg.skip);
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.skip !== previousArg?.skip,
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
      async onQueryStarted(query, { queryFulfilled }) {
        await cacheProducts(queryFulfilled, 'getProducts', query);
      },
    }),
    searchProducts: builder.query<ProductsPage, ProductSearchQuery>({
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}(${queryArgs.q}:${queryArgs.limit})`,
      merge: (currentCache, response, { arg }) => {
        mergeProductPage(currentCache, response, arg.skip);
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.skip !== previousArg?.skip,
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
      async onQueryStarted(query, { queryFulfilled }) {
        await cacheProducts(queryFulfilled, 'searchProducts', query);
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

const revalidate = { refetchOnMountOrArgChange: true } as const;

type QueryOptions = {
  skip?: boolean;
};

export function useGetProductsQuery(
  query: ProductsQuery,
  options?: QueryOptions,
) {
  return catalogApi.useGetProductsQuery(query, {
    ...revalidate,
    skip: options?.skip,
  });
}

export function useSearchProductsQuery(
  query: ProductSearchQuery,
  options?: QueryOptions,
) {
  return catalogApi.useSearchProductsQuery(query, {
    ...revalidate,
    skip: options?.skip,
  });
}

export function useGetCategoriesQuery() {
  return catalogApi.useGetCategoriesQuery(undefined, revalidate);
}
