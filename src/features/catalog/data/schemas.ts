export const ProductSchema = {
  name: 'Product',
  primaryKey: 'id',
  properties: {
    id: 'int',
    title: 'string',
    description: 'string',
    category: 'string',
    price: 'double',
    rating: 'double',
    thumbnail: 'string',
    brand: 'string?',
    stock: 'int',
    imagesJson: 'string',
  },
};

export const FeedSnapshotSchema = {
  name: 'FeedSnapshot',
  primaryKey: 'queryKey',
  properties: {
    queryKey: 'string',
    endpoint: 'string',
    argsJson: 'string',
    productIdsJson: 'string',
    total: 'int',
    skip: 'int',
    limit: 'int',
    updatedAt: 'date',
  },
};

export const CategorySchema = {
  name: 'Category',
  primaryKey: 'slug',
  properties: {
    slug: 'string',
    name: 'string',
    url: 'string',
  },
};
