import type { Category, Product } from '../../features/catalog';

export type CatalogRepository = {
  upsertProducts: (products: Product[]) => void;
  upsertCategories: (categories: Category[]) => void;
  readProducts: () => Product[];
  readProduct: (id: number) => Product | null;
  readCategories: () => Category[];
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
