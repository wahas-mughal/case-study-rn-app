import Realm from 'realm';

import { QueuedActionSchema } from '../../features/cart/data/queuedActionSchema';
import type { QueuedAction } from '../../features/cart/model/types';
import {
  CachedImageSchema,
  CategorySchema,
  FeedSnapshotSchema,
  ProductSchema,
} from '../../features/catalog/data/schemas';
import type { Category, Product } from '../../features/catalog';
import {
  setRepository,
  type CatalogRepository,
  type FeedEndpoint,
  type FeedRecord,
} from './repository';

const SCHEMA_VERSION = 4;

type ProductRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  thumbnail: string;
  brand: string | null;
  stock: number;
  imagesJson: string;
};

type CategoryRow = {
  slug: string;
  name: string;
  url: string;
};

type QueuedActionRow = {
  id: string;
  type: string;
  productId: number;
  quantity: number;
  createdAt: Date;
};

type CachedImageRow = {
  url: string;
  dataUri: string;
};

type FeedRow = {
  queryKey: string;
  endpoint: string;
  argsJson: string;
  productIdsJson: string;
  total: number;
  skip: number;
  limit: number;
  updatedAt: Date;
};

function readImages(imagesJson: string): string[] {
  try {
    const parsed: unknown = JSON.parse(imagesJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    price: row.price,
    rating: row.rating,
    thumbnail: row.thumbnail,
    brand: row.brand ?? undefined,
    stock: row.stock,
    images: readImages(row.imagesJson),
  };
}

function toCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    url: row.url,
  };
}

function readIds(productIdsJson: string): number[] {
  try {
    const parsed: unknown = JSON.parse(productIdsJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is number => typeof item === 'number');
  } catch {
    return [];
  }
}

function isFeedEndpoint(endpoint: string): endpoint is FeedEndpoint {
  return endpoint === 'getProducts' || endpoint === 'searchProducts';
}

function toFeed(row: FeedRow): FeedRecord | null {
  if (!isFeedEndpoint(row.endpoint)) {
    return null;
  }

  try {
    const args: unknown = JSON.parse(row.argsJson);
    if (!args || typeof args !== 'object') {
      return null;
    }

    return {
      endpoint: row.endpoint,
      args: args as FeedRecord['args'],
      productIds: readIds(row.productIdsJson),
      total: row.total,
      skip: row.skip,
      limit: row.limit,
    };
  } catch {
    return null;
  }
}

function createRealmRepository(realm: Realm): CatalogRepository {
  return {
    upsertProducts(products) {
      realm.write(() => {
        products.forEach(product => {
          realm.create(
            ProductSchema.name,
            {
              id: product.id,
              title: product.title,
              description: product.description,
              category: product.category,
              price: product.price,
              rating: product.rating,
              thumbnail: product.thumbnail,
              brand: product.brand ?? null,
              stock: product.stock,
              imagesJson: JSON.stringify(product.images),
            },
            Realm.UpdateMode.Modified,
          );
        });
      });
    },
    upsertCategories(categories) {
      realm.write(() => {
        categories.forEach(category => {
          realm.create(
            CategorySchema.name,
            category,
            Realm.UpdateMode.Modified,
          );
        });
      });
    },
    readProducts() {
      return Array.from(realm.objects<ProductRow>(ProductSchema.name)).map(
        toProduct,
      );
    },
    readProduct(id) {
      const row = realm.objectForPrimaryKey<ProductRow>(ProductSchema.name, id);
      return row ? toProduct(row) : null;
    },
    readCategories() {
      return Array.from(realm.objects<CategoryRow>(CategorySchema.name)).map(
        toCategory,
      );
    },
    saveFeed(feed) {
      const argsJson = JSON.stringify(feed.args);
      realm.write(() => {
        realm.create(
          FeedSnapshotSchema.name,
          {
            queryKey: `${feed.endpoint}:${argsJson}`,
            endpoint: feed.endpoint,
            argsJson,
            productIdsJson: JSON.stringify(feed.productIds),
            total: feed.total,
            skip: feed.skip,
            limit: feed.limit,
            updatedAt: new Date(),
          },
          Realm.UpdateMode.Modified,
        );
      });
    },
    readLatestFeed() {
      const latest = realm
        .objects<FeedRow>(FeedSnapshotSchema.name)
        .sorted('updatedAt', true)[0];

      return latest ? toFeed(latest) : null;
    },
    readImage(url) {
      const row = realm.objectForPrimaryKey<CachedImageRow>(
        CachedImageSchema.name,
        url,
      );
      return row?.dataUri ?? null;
    },
    saveImage(url, dataUri) {
      realm.write(() => {
        realm.create(
          CachedImageSchema.name,
          { url, dataUri },
          Realm.UpdateMode.Modified,
        );
      });
    },
    enqueueAction(action) {
      realm.write(() => {
        realm.create(
          QueuedActionSchema.name,
          action,
          Realm.UpdateMode.Modified,
        );
      });
    },
    readQueuedActions() {
      return Array.from(realm.objects<QueuedActionRow>(QueuedActionSchema.name))
        .map(toQueuedAction)
        .sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
        );
    },
    deleteQueuedAction(id) {
      const row = realm.objectForPrimaryKey<QueuedActionRow>(
        QueuedActionSchema.name,
        id,
      );

      if (!row) {
        return;
      }

      realm.write(() => {
        realm.delete(row);
      });
    },
  };
}

function toQueuedAction(row: QueuedActionRow): QueuedAction {
  return {
    id: row.id,
    type: 'addToCart',
    productId: row.productId,
    quantity: row.quantity,
    createdAt: row.createdAt,
  };
}

export function openCatalogRepository(): CatalogRepository {
  const realm = new Realm({
    path: 'catalog.realm',
    schema: [
      ProductSchema,
      CategorySchema,
      FeedSnapshotSchema,
      CachedImageSchema,
      QueuedActionSchema,
    ],
    schemaVersion: SCHEMA_VERSION,
    onMigration: () => undefined,
  });
  const repository = createRealmRepository(realm);
  setRepository(repository);
  return repository;
}
