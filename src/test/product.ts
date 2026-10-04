import type { Product } from '../features/catalog';

export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Phone',
    description: 'A phone',
    category: 'smartphones',
    price: 100,
    rating: 4.5,
    thumbnail: 'https://example.com/thumb.jpg',
    stock: 3,
    images: ['https://example.com/1.jpg'],
    ...overrides,
  };
}
