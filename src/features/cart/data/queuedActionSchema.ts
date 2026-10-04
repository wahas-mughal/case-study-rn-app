export const QueuedActionSchema = {
  name: 'QueuedAction',
  primaryKey: 'id',
  properties: {
    id: 'string',
    type: 'string',
    productId: 'int',
    quantity: 'int',
    createdAt: 'date',
  },
};
