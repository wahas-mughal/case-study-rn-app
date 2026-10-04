export const PRODUCT_PAGE_SIZE = 20;

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  thumbnail: string;
  brand?: string;
  stock: number;
  images: string[];
};

export type ProductsPage = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

export type ProductSort = 'price-asc' | 'price-desc' | 'rating-desc';

export type ProductsQuery = {
  limit: number;
  skip: number;
  category?: string;
  sortBy?: 'price' | 'rating';
  order?: 'asc' | 'desc';
};

export function toSortQuery(
  sort: ProductSort | '',
): Pick<ProductsQuery, 'sortBy' | 'order'> {
  if (sort === 'price-asc') {
    return { sortBy: 'price', order: 'asc' };
  }

  if (sort === 'price-desc') {
    return { sortBy: 'price', order: 'desc' };
  }

  if (sort === 'rating-desc') {
    return { sortBy: 'rating', order: 'desc' };
  }

  return {};
}

export type ProductSearchQuery = ProductsQuery & {
  q: string;
};

export type Category = {
  slug: string;
  name: string;
  url: string;
};
