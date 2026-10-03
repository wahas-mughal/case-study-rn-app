export type ProductsUrlArgs = {
  limit: number;
  skip: number;
};

export function buildProductsUrl({ limit, skip }: ProductsUrlArgs): string {
  const params = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
  });

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
}: ProductSearchUrlArgs): string {
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    skip: String(skip),
  });

  return `products/search?${params.toString()}`;
}
