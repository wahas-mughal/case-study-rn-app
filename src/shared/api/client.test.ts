import { ApiError, request } from './client';

describe('request', () => {
  it('sends a get request and returns json', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await expect(request<{ ok: boolean }>('products')).resolves.toEqual({
      ok: true,
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://dummyjson.com/products',
      expect.objectContaining({
        method: 'GET',
        body: undefined,
      }),
    );
  });

  it('sends a json body', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 3 }),
    });

    await request('carts/add', { method: 'POST', body: { userId: 1 } });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://dummyjson.com/carts/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 1 }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('throws the response status', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(request('products')).rejects.toBeInstanceOf(ApiError);
    await expect(request('products')).rejects.toMatchObject({ status: 503 });
  });
});
