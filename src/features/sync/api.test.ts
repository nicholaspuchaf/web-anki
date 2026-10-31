import { expect, test } from 'bun:test';
import { CloudError, createCloudApi, type HttpRequest } from './api';
import { emptyLibrary } from '../library/model';

test('cliente valida a biblioteca e envia sua revisão para detectar conflitos', async () => {
  const calls: Array<{ url: string; options?: RequestInit }> = [];
  const request = (async (
    url: string | URL | Request,
    options?: RequestInit,
  ) => {
    calls.push({ url: String(url), options });
    return Response.json(
      options?.method === 'GET'
        ? { revision: '0', updatedAt: null, library: emptyLibrary }
        : { revision: 'new', updatedAt: '2026-10-31T00:00:00Z' },
    );
  }) as HttpRequest;
  const api = createCloudApi('https://api.example/', request);
  expect((await api.get()).library).toEqual(emptyLibrary);
  await api.put(emptyLibrary, '0');
  expect(calls[1].url).toBe('https://api.example/library');
  expect(calls[1].options?.headers).toEqual({
    'content-type': 'application/json',
    'if-match': '0',
  });
  expect(calls[1].options?.body).toBe(JSON.stringify(emptyLibrary));
});

test('cliente preserva o status de conflito e rejeita bibliotecas inválidas', async () => {
  const conflict = (async () =>
    Response.json({ error: 'Conflito' }, { status: 409 })) as HttpRequest;
  await expect(
    createCloudApi('https://api.example', conflict).put(emptyLibrary, '0'),
  ).rejects.toMatchObject({ status: 409, message: 'Conflito' });
  expect(new CloudError('erro', 409)).toBeInstanceOf(Error);
  const invalid = (async () =>
    Response.json({
      revision: '0',
      updatedAt: null,
      library: {},
    })) as HttpRequest;
  await expect(
    createCloudApi('https://api.example', invalid).get(),
  ).rejects.toThrow();
});
