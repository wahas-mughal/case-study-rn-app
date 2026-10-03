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

export type ProductsQuery = {
  limit: number;
  skip: number;
};

export type Category = {
  slug: string;
  name: string;
  url: string;
};
