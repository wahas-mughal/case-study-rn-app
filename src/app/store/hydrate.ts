import { catalogApi } from '../../features/catalog/api/catalogApi';
import type {
  Product,
  ProductSearchQuery,
  ProductsPage,
  ProductsQuery,
} from '../../features/catalog';
import { productDetailApi } from '../../features/productDetail/api/productDetailApi';
import { getRepository } from '../../shared/db/repository';
import type { AppDispatch } from './store';

function isProductsQuery(value: unknown): value is ProductsQuery {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const query = value as ProductsQuery;
  return typeof query.limit === 'number' && typeof query.skip === 'number';
}

function isProductSearchQuery(value: unknown): value is ProductSearchQuery {
  if (!isProductsQuery(value)) {
    return false;
  }

  return typeof (value as ProductSearchQuery).q === 'string';
}

export function hydrateCatalog(dispatch: AppDispatch) {
  const repository = getRepository();
  const categories = repository.readCategories();

  if (categories.length > 0) {
    dispatch(
      catalogApi.util.upsertQueryData('getCategories', undefined, categories),
    );
  }

  repository.readProducts().forEach(product => {
    dispatch(
      productDetailApi.util.upsertQueryData('getProduct', product.id, product),
    );
  });

  const feed = repository.readLatestFeed();
  if (!feed) {
    return;
  }

  const products = feed.productIds
    .map(id => repository.readProduct(id))
    .filter((product): product is Product => product !== null);
  const page: ProductsPage = {
    products,
    total: feed.total,
    skip: feed.skip,
    limit: feed.limit,
  };

  if (feed.endpoint === 'searchProducts' && isProductSearchQuery(feed.args)) {
    dispatch(
      catalogApi.util.upsertQueryData('searchProducts', feed.args, page),
    );
    return;
  }

  if (isProductsQuery(feed.args)) {
    dispatch(catalogApi.util.upsertQueryData('getProducts', feed.args, page));
  }
}
