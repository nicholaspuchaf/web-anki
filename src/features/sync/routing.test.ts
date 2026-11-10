import { expect, spyOn, test } from 'bun:test';
import { createHandler, type HttpEvent } from '../../../backend/service';
import type { FlashcardStore } from '../../../backend/model';
import type { ReworkStore } from '../../../backend/rework';

const origin = 'https://folha.pages.dev';
const timestamp = '2026-11-09T12:00:00.000Z';
function event(path: string, method = 'GET'): HttpEvent {
  return {
    requestContext: { http: { path, method } },
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_id: 'd', question: 'Pergunta' }),
  };
}

test('roteador aplica origem, preflight, 404, 405 e descontinuação antes de acessar dependências', async () => {
  let calls = 0;
  const forbidden = async () => {
    calls++;
    throw new Error('Não chamar');
  };
  const store: FlashcardStore = {
    get: forbidden,
    put: forbidden,
    changes: forbidden,
  };
  const rework: ReworkStore = { mark: forbidden, list: forbidden };
  const handler = createHandler(store, [origin], undefined, forbidden, rework);
  for (const path of [
    '/sync',
    '/flashcards/a',
    '/flashcards/a/rework',
    '/rework-requests',
    '/leetcode/problems/two-sum',
  ]) {
    const response = await handler(event(path, 'PATCH'));
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Método não permitido.',
    });
    expect(
      (
        await handler({
          ...event(path, 'OPTIONS'),
          headers: { Origin: 'https://other.example' },
        })
      ).statusCode,
    ).toBe(403);
    const options = await handler(event(path, 'OPTIONS'));
    expect(options.statusCode).toBe(204);
    expect(options.body).toBe('');
  }
  expect((await handler(event('/unknown'))).statusCode).toBe(404);
  expect((await handler(event('/flashcards/a/rework/extra'))).statusCode).toBe(
    404,
  );
  expect((await handler(event('/library', 'POST'))).statusCode).toBe(410);
  for (const path of ['/sync\n', '/library\n', '/rework-requests\n'])
    expect((await handler(event(path))).statusCode).toBe(404);
  expect(calls).toBe(0);
});

test('registro encaminha parâmetros, rawPath e cabeçalhos normalizados ao endpoint correto', async () => {
  const calls: string[] = [];
  const store: FlashcardStore = {
    async get(id) {
      calls.push(`get:${id}`);
      return null;
    },
    async put() {
      throw new Error('Não gravar cartão');
    },
    async changes() {
      calls.push('sync');
      return { items: [] };
    },
  };
  const rework: ReworkStore = {
    async mark(item) {
      calls.push(`mark:${item.flashcard_id}`);
      expect(item.requested_at).toBe(timestamp);
      return true;
    },
    async list(limit) {
      calls.push(`list:${limit}`);
      return { items: [] };
    },
  };
  const handler = createHandler(
    store,
    [origin],
    () => new Date(timestamp),
    undefined,
    rework,
  );
  expect((await handler(event('/flashcards/personal'))).statusCode).toBe(404);
  const sync = await handler({ ...event('/ignored'), rawPath: '/sync' });
  expect(sync.statusCode).toBe(200);
  expect(JSON.parse(sync.body).last_sync_at).toBe(timestamp);
  expect(
    (await handler(event('/flashcards/builtin-mc714-x/rework', 'PUT')))
      .statusCode,
  ).toBe(201);
  expect(
    (
      await handler({
        ...event('/rework-requests'),
        queryStringParameters: { limit: '2' },
      })
    ).statusCode,
  ).toBe(200);
  expect(calls).toEqual([
    'get:personal',
    'sync',
    'mark:builtin-mc714-x',
    'list:2',
  ]);
  expect(sync.headers).toEqual({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
});

test('tratamento compartilhado preserva erros de armazenamento e o mapeamento específico do LeetCode', async () => {
  let cause: Error = Object.assign(new Error('internal secret'), {
    name: 'ThrottlingException',
  });
  const fail = async () => {
    throw cause;
  };
  const store: FlashcardStore = { get: fail, put: fail, changes: fail };
  const rework: ReworkStore = { mark: fail, list: fail };
  const handler = createHandler(
    store,
    [origin],
    () => new Date(timestamp),
    fail,
    rework,
  );
  for (const [path, method] of [
    ['/sync', 'GET'],
    ['/flashcards/a', 'GET'],
    ['/flashcards/a/rework', 'PUT'],
    ['/rework-requests', 'GET'],
  ])
    expect((await handler(event(path, method))).statusCode).toBe(429);
  expect((await handler(event('/leetcode/problems/two-sum'))).statusCode).toBe(
    502,
  );
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    cause = new Error('internal secret');
    const result = await handler(event('/sync'));
    expect(result.statusCode).toBe(500);
    expect(result.body).not.toContain('internal secret');
    expect(log).toHaveBeenCalledWith('Flashcard request failed', {
      name: 'Error',
    });
  } finally {
    log.mockRestore();
  }
});
