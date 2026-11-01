import { expect, test } from 'bun:test';
import { createHandler, type HttpEvent } from '../../../backend/service';
import {
  cardKey,
  type FlashcardStore,
  type StoredFlashcard,
  type ChangeQuery,
} from '../../../backend/model';

const origin = 'https://folha.pages.dev';
const start = '2026-11-01T10:00:00.000Z';
const card = {
  id: 'c',
  deckId: 'd',
  front: 'Pergunta',
  back: '',
  due: 0,
  interval: 0,
  reviews: 0,
};
const payload = { card, deck: { id: 'd', name: 'LeetCode' } };
function setup() {
  let time = Date.parse(start);
  const items = new Map<string, StoredFlashcard>();
  const queries: ChangeQuery[] = [];
  const store: FlashcardStore = {
    async get(id) {
      return items.get(id) ?? null;
    },
    async put(item, expected) {
      if ((items.get(item.flashcard_id)?.version ?? 0) !== expected)
        return false;
      items.set(item.flashcard_id, item);
      return true;
    },
    async changes(query) {
      queries.push(query);
      const eligible = [...items.values()]
        .filter(
          (item) =>
            item.last_updated_at >= query.from &&
            item.last_updated_at <= query.until,
        )
        .sort(
          (a, b) =>
            a.last_updated_at.localeCompare(b.last_updated_at) ||
            a.pk.localeCompare(b.pk),
        );
      const offset = query.after
        ? eligible.findIndex((item) => item.pk === query.after!.pk) + 1
        : 0;
      const page = eligible.slice(offset, offset + query.limit);
      const last = page.at(-1);
      return {
        items: page,
        ...(last && offset + page.length < eligible.length
          ? {
              next: {
                pk: last.pk,
                library_id: last.library_id,
                last_updated_at: last.last_updated_at,
              },
            }
          : {}),
      };
    },
  };
  return {
    store,
    items,
    queries,
    handler: createHandler(store, [origin], () => new Date(time)),
    advance(ms: number) {
      time += ms;
    },
  };
}
function event(
  method: string,
  body?: unknown,
  version = '0',
  path = '/flashcards/c',
  queryStringParameters?: HttpEvent['queryStringParameters'],
): HttpEvent {
  return {
    requestContext: { http: { method, path } },
    headers: {
      origin,
      'content-type': 'application/json',
      'if-match': version,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    queryStringParameters,
  };
}
function sync(params?: HttpEvent['queryStringParameters']) {
  return event('GET', undefined, '0', '/sync', params);
}

test('grava cada cartão separadamente com data do servidor e versos opcionais', async () => {
  const { handler, items } = setup();
  const result = await handler(
    event('PUT', {
      ...payload,
      last_updated_at: '2099-01-01T00:00:00.000Z',
      version: 99,
    }),
  );
  expect(result.statusCode).toBe(201);
  expect(JSON.parse(result.body)).toEqual({
    flashcard_id: 'c',
    version: 1,
    last_updated_at: start,
    deleted_at: null,
    ...payload,
  });
  expect(items.get('c')!.pk).toBe(cardKey('c'));
  expect(JSON.parse((await handler(event('GET'))).body)).not.toHaveProperty(
    'pk',
  );
  const second = { ...payload, card: { ...card, id: 'other' } };
  expect(
    (await handler(event('PUT', second, '0', '/flashcards/other'))).statusCode,
  ).toBe(201);
  expect(items.size).toBe(2);
});

test('atualização monotônica e conflitos por cartão inclusive na escrita concorrente', async () => {
  const { handler, store } = setup();
  await handler(event('PUT', payload));
  expect((await handler(event('PUT', payload))).statusCode).toBe(409);
  const updated = await handler(event('PUT', payload, '1'));
  expect(JSON.parse(updated.body)).toMatchObject({
    version: 2,
    last_updated_at: '2026-11-01T10:00:00.001Z',
  });
  store.put = async () => false;
  expect((await handler(event('PUT', payload, '2'))).statusCode).toBe(409);
  const missing = event('PUT', payload);
  delete missing.headers!['if-match'];
  expect((await handler(missing)).statusCode).toBe(428);
});

test('exclusão vira tombstone sincronizável e não permite recriar com versão zero', async () => {
  const { handler, advance } = setup();
  expect((await handler(event('DELETE'))).statusCode).toBe(404);
  await handler(event('PUT', payload));
  advance(1000);
  const result = await handler(event('DELETE', undefined, '1'));
  const tombstone = JSON.parse(result.body);
  expect(tombstone).toEqual({
    flashcard_id: 'c',
    version: 2,
    last_updated_at: '2026-11-01T10:00:01.000Z',
    deleted_at: '2026-11-01T10:00:01.000Z',
  });
  expect(
    JSON.parse((await handler(sync({ since: start }))).body).changes,
  ).toEqual([tombstone]);
  expect((await handler(event('PUT', payload))).statusCode).toBe(409);
  expect(
    JSON.parse((await handler(event('DELETE', undefined, '2'))).body),
  ).toEqual(tombstone);
  expect((await handler(event('PUT', payload, '2'))).statusCode).toBe(200);
});

test('sync sobrepõe 2 minutos e só fornece checkpoint ao terminar todas as páginas com datas iguais', async () => {
  const { handler, advance, queries } = setup();
  await handler(event('PUT', payload));
  await handler(
    event(
      'PUT',
      { ...payload, card: { ...card, id: 'b' } },
      '0',
      '/flashcards/b',
    ),
  );
  advance(60_000);
  const first = JSON.parse(
    (await handler(sync({ since: start, limit: '1' }))).body,
  );
  expect(first.last_sync_at).toBeNull();
  expect(first.next_cursor).toBeString();
  expect(queries[0].from).toBe('2026-11-01T09:58:00.000Z');
  advance(60_000);
  const last = JSON.parse(
    (await handler(sync({ cursor: first.next_cursor }))).body,
  );
  expect(last.next_cursor).toBeNull();
  expect(last.last_sync_at).toBe('2026-11-01T10:01:00.000Z');
  expect(
    [...first.changes, ...last.changes].map((item) => item.flashcard_id).sort(),
  ).toEqual(['b', 'c']);
  expect(queries[1].until).toBe(queries[0].until);
});

test('sync incremental omite itens antigos e permite reconciliação sem since', async () => {
  const { handler, advance } = setup();
  await handler(event('PUT', payload));
  advance(600_000);
  const checkpoint = JSON.parse((await handler(sync())).body).last_sync_at;
  expect(
    JSON.parse((await handler(sync({ since: checkpoint }))).body).changes,
  ).toEqual([]);
  expect(JSON.parse((await handler(sync())).body).changes).toHaveLength(1);
  await handler(
    event('PUT', { ...payload, card: { ...card, front: 'Alterada' } }, '1'),
  );
  expect(
    JSON.parse((await handler(sync({ since: checkpoint }))).body).changes[0]
      .card.front,
  ).toBe('Alterada');
});

test('parâmetros inválidos e cursor fora da biblioteca são rejeitados sem consultar banco', async () => {
  const { handler, queries } = setup();
  const badCursor = Buffer.from(
    JSON.stringify({
      from: start,
      until: start,
      limit: 1,
      after: { pk: 'FLASHCARD#c', library_id: 'OTHER', last_updated_at: start },
    }),
  ).toString('base64url');
  for (const params of [
    { since: 'amanhã' },
    { since: '2099-01-01T00:00:00.000Z' },
    { limit: '0' },
    { limit: '51' },
    { limit: '1.5' },
    { cursor: 'xxx' },
    { cursor: badCursor },
    { cursor: badCursor, since: start },
  ])
    expect((await handler(sync(params))).statusCode).toBe(400);
  expect(queries).toHaveLength(0);
});

test('valida origem, rotas, métodos, conteúdo e tamanho antes de gravar', async () => {
  const { handler, items } = setup();
  const denied = sync();
  denied.headers!.origin = 'https://other.example';
  expect((await handler(denied)).statusCode).toBe(403);
  const publicRequest = sync();
  delete publicRequest.headers!.origin;
  expect((await handler(publicRequest)).statusCode).toBe(200);
  expect((await handler(event('POST'))).statusCode).toBe(405);
  expect((await handler(event('PUT', payload, '0', '/sync'))).statusCode).toBe(
    405,
  );
  expect(
    (await handler(event('GET', undefined, '0', '/unknown'))).statusCode,
  ).toBe(404);
  expect(
    (await handler(event('GET', undefined, '0', '/library'))).statusCode,
  ).toBe(410);
  expect((await handler(event('GET'))).statusCode).toBe(404);
  expect((await handler(event('PUT', {}))).statusCode).toBe(400);
  expect(
    (
      await handler(
        event('PUT', { ...payload, card: { ...card, id: 'wrong' } }),
      )
    ).statusCode,
  ).toBe(400);
  expect(
    (await handler(event('PUT', payload, '0', '/flashcards/bad%20id')))
      .statusCode,
  ).toBe(400);
  const wrongType = event('PUT', payload);
  wrongType.headers!['content-type'] = 'text/plain';
  expect((await handler(wrongType)).statusCode).toBe(415);
  expect(
    (
      await handler(
        event('PUT', {
          ...payload,
          card: { ...card, front: 'x'.repeat(250_001) },
        }),
      )
    ).statusCode,
  ).toBe(413);
  expect(items.size).toBe(0);
});

test('aceita corpo base64 e retorna erros recuperáveis de capacidade', async () => {
  const { handler, store } = setup();
  const encoded = event('PUT');
  encoded.body = Buffer.from(JSON.stringify(payload)).toString('base64');
  encoded.isBase64Encoded = true;
  expect((await handler(encoded)).statusCode).toBe(201);
  store.changes = async () => {
    throw Object.assign(new Error('throttled'), {
      name: 'ProvisionedThroughputExceededException',
    });
  };
  expect((await handler(sync())).statusCode).toBe(429);
});
