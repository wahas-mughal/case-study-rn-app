import Realm from 'realm';

import {
  CategorySchema,
  ProductSchema,
} from '../../features/catalog/data/schemas';
import type { Category, Product } from '../../features/catalog';
import { setRepository, type CatalogRepository } from './repository';

const SCHEMA_VERSION = 1;

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
  };
}

export function openCatalogRepository(): CatalogRepository {
  const realm = new Realm({
    path: 'catalog.realm',
    schema: [ProductSchema, CategorySchema],
    schemaVersion: SCHEMA_VERSION,
  });
  const repository = createRealmRepository(realm);
  setRepository(repository);
  return repository;
}
