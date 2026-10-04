export type ProductsUrlArgs = {
  limit: number;
  skip: number;
  category?: string;
  sortBy?: 'price' | 'rating';
  order?: 'asc' | 'desc';
};

function appendListParams({
  limit,
  skip,
  sortBy,
  order,
}: ProductsUrlArgs): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
  });

  if (sortBy && order) {
    params.set('sortBy', sortBy);
    params.set('order', order);
  }

  return params;
}

export function buildProductsUrl(args: ProductsUrlArgs): string {
  const params = appendListParams(args);

  if (args.category) {
    return `products/category/${encodeURIComponent(
      args.category,
    )}?${params.toString()}`;
  }

  return `products?${params.toString()}`;
}

export function buildCategoriesUrl(): string {
  return 'products/categories';
}

export type ProductSearchUrlArgs = ProductsUrlArgs & {
  q: string;
};

export function buildProductSearchUrl({
  q,
  limit,
  skip,
  sortBy,
  order,
}: ProductSearchUrlArgs): string {
  const params = appendListParams({ limit, skip, sortBy, order });
  params.set('q', q);

  return `products/search?${params.toString()}`;
}

export function buildProductUrl(id: number): string {
  return `products/${id}`;
}
