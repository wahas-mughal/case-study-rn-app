import type { QueuedAction } from '../../features/cart/model/types';
import type {
  Category,
  Product,
  ProductSearchQuery,
  ProductsQuery,
} from '../../features/catalog';

export type FeedEndpoint = 'getProducts' | 'searchProducts';

export type FeedRecord = {
  endpoint: FeedEndpoint;
  args: ProductsQuery | ProductSearchQuery;
  productIds: number[];
  total: number;
  skip: number;
  limit: number;
};

export type CatalogRepository = {
  upsertProducts: (products: Product[]) => void;
  upsertCategories: (categories: Category[]) => void;
  saveFeed: (feed: FeedRecord) => void;
  readLatestFeed: () => FeedRecord | null;
  readProducts: () => Product[];
  readProduct: (id: number) => Product | null;
  readCategories: () => Category[];
  readImage: (url: string) => string | null;
  saveImage: (url: string, dataUri: string) => void;
  enqueueAction: (action: QueuedAction) => void;
  readQueuedActions: () => QueuedAction[];
  deleteQueuedAction: (id: string) => void;
};

let repository: CatalogRepository | null = null;

export function getRepository(): CatalogRepository {
  if (!repository) {
    throw new Error('Catalog repository is not open');
  }

  return repository;
}

export function setRepository(next: CatalogRepository) {
  repository = next;
}
