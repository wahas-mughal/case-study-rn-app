beforeEach(() => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ products: [], total: 0, skip: 0, limit: 20 }),
    headers: { get: () => 'application/json' },
    arrayBuffer: async () => new ArrayBuffer(0),
  });
});

afterEach(async () => {
  if (typeof globalThis.fetch !== 'function') {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => new ArrayBuffer(0),
    });
  }

  for (let step = 0; step < 8; step += 1) {
    await new Promise<void>(resolve => {
      setImmediate(() => resolve());
    });
  }
});
