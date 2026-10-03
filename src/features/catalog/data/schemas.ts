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

export const CategorySchema = {
  name: 'Category',
  primaryKey: 'slug',
  properties: {
    slug: 'string',
    name: 'string',
    url: 'string',
  },
};
