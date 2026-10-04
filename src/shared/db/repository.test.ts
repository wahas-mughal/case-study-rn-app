import { getRepository, setRepository } from './repository';
import { createMemoryRepository } from '../../test/memoryRepository';
import { product } from '../../test/product';

describe('repository registry', () => {
  it('throws until a repository is open', () => {
    expect(getRepository).toThrow('Catalog repository is not open');
  });

  it('returns the repository that was opened', () => {
    const repository = createMemoryRepository();
    repository.upsertProducts([product({ id: 7, title: 'Tablet' })]);
    setRepository(repository);

    expect(getRepository().readProduct(7)?.title).toBe('Tablet');
  });
});
