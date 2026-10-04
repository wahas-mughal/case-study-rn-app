import type { QueuedAction } from '../features/cart/model/types';
import type { Category, Product } from '../features/catalog';
import type { CatalogRepository, FeedRecord } from '../shared/db/repository';

export function createMemoryRepository(): CatalogRepository {
  const products = new Map<number, Product>();
  const categories = new Map<string, Category>();
  const images = new Map<string, string>();
  const actions = new Map<string, QueuedAction>();
  let feed: FeedRecord | null = null;

  return {
    upsertProducts(next) {
      next.forEach(product => {
        products.set(product.id, product);
      });
    },
    upsertCategories(next) {
      next.forEach(category => {
        categories.set(category.slug, category);
      });
    },
    saveFeed(next) {
      feed = next;
    },
    readLatestFeed() {
      return feed;
    },
    readProducts() {
      return [...products.values()];
    },
    readProduct(id) {
      return products.get(id) ?? null;
    },
    readCategories() {
      return [...categories.values()];
    },
    readImage(url) {
      return images.get(url) ?? null;
    },
    saveImage(url, dataUri) {
      images.set(url, dataUri);
    },
    enqueueAction(action) {
      actions.set(action.id, action);
    },
    readQueuedActions() {
      return [...actions.values()].sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      );
    },
    deleteQueuedAction(id) {
      actions.delete(id);
    },
  };
}
