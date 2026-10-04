import { toSortQuery } from './types';

describe('toSortQuery', () => {
  it('maps each chip to the query the API expects', () => {
    expect(toSortQuery('price-asc')).toEqual({
      sortBy: 'price',
      order: 'asc',
    });
    expect(toSortQuery('price-desc')).toEqual({
      sortBy: 'price',
      order: 'desc',
    });
    expect(toSortQuery('rating-desc')).toEqual({
      sortBy: 'rating',
      order: 'desc',
    });
    expect(toSortQuery('')).toEqual({});
  });
});
