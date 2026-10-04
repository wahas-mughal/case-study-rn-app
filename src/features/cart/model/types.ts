export type QueuedAction = {
  id: string;
  type: 'addToCart';
  productId: number;
  quantity: number;
  createdAt: Date;
};
