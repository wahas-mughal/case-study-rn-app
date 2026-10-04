import {
  buildAddToCartUrl,
  buildCategoriesUrl,
  buildProductSearchUrl,
  buildProductUrl,
  buildProductsUrl,
} from './url';

describe('product urls', () => {
  it('builds a product list url', () => {
    expect(buildProductsUrl({ limit: 20, skip: 0 })).toBe(
      'products?limit=20&skip=0',
    );
  });

  it('builds a category url with sort', () => {
    expect(
      buildProductsUrl({
        limit: 20,
        skip: 40,
        category: 'smart phones',
        sortBy: 'price',
        order: 'desc',
      }),
    ).toBe(
      'products/category/smart%20phones?limit=20&skip=40&sortBy=price&order=desc',
    );
  });

  it('leaves sort off when only one side is set', () => {
    expect(buildProductsUrl({ limit: 10, skip: 0, sortBy: 'price' })).toBe(
      'products?limit=10&skip=0',
    );
  });

  it('builds search, detail, category, and cart urls', () => {
    expect(buildCategoriesUrl()).toBe('products/categories');
    expect(buildProductUrl(4)).toBe('products/4');
    expect(buildAddToCartUrl()).toBe('carts/add');
    expect(
      buildProductSearchUrl({
        q: 'red phone',
        limit: 20,
        skip: 0,
        sortBy: 'rating',
        order: 'asc',
      }),
    ).toBe('products/search?limit=20&skip=0&sortBy=rating&order=asc&q=red+phone');
  });
});
