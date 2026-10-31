import { expect, test } from 'bun:test';
import { randomBytes } from 'node:crypto';
import {
  createHandler,
  type HttpEvent,
  type SnapshotStore,
  type StoredSnapshot,
} from '../../../backend/service';
import { emptyLibrary } from '../library/model';
const origin = 'https://folha.pages.dev';
function setup() {
  let current: StoredSnapshot | null = null;
  const store: SnapshotStore = {
    async get() {
      return current;
    },
    async put(next, expected) {
      if ((current?.revision ?? '0') !== expected) return false;
      current = next;
      return true;
    },
  };
  return { store, handler: createHandler(store, [origin]) };
}
function event(method: string, body?: unknown, revision = '0'): HttpEvent {
  return {
    requestContext: { http: { method, path: '/library' } },
    headers: {
      origin,
      'content-type': 'application/json',
      'if-match': revision,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

test('biblioteca pública pode ser criada, lida e esvaziada sem autenticação', async () => {
  const { handler } = setup();
  expect(JSON.parse((await handler(event('GET'))).body)).toMatchObject({
    revision: '0',
    library: emptyLibrary,
  });
  const library = { ...emptyLibrary, decks: [{ id: 'd', name: 'Pública' }] };
  const created = await handler(event('PUT', library));
  expect(created.statusCode).toBe(200);
  const revision = JSON.parse(created.body).revision;
  expect(JSON.parse((await handler(event('GET'))).body).library).toEqual(
    library,
  );
  expect((await handler(event('PUT', emptyLibrary, revision))).statusCode).toBe(
    200,
  );
  expect(JSON.parse((await handler(event('GET'))).body).library).toEqual(
    emptyLibrary,
  );
});

test('uma escrita concorrente não sobrescreve a biblioteca mais recente', async () => {
  const { handler } = setup();
  expect((await handler(event('PUT', emptyLibrary))).statusCode).toBe(200);
  expect((await handler(event('PUT', emptyLibrary))).statusCode).toBe(409);
  const missing = event('PUT', emptyLibrary);
  delete missing.headers!['if-match'];
  expect((await handler(missing)).statusCode).toBe(428);
});

test('valida origem, rota, método e formato sem confiar em CORS como autenticação', async () => {
  const { handler } = setup();
  const denied = event('GET');
  denied.headers!.origin = 'https://other.example';
  expect((await handler(denied)).statusCode).toBe(403);
  const publicRequest = event('GET');
  delete publicRequest.headers!.origin;
  expect((await handler(publicRequest)).statusCode).toBe(200);
  expect((await handler(event('DELETE'))).statusCode).toBe(405);
  const missingRoute = event('GET');
  missingRoute.requestContext.http.path = '/unknown';
  expect((await handler(missingRoute)).statusCode).toBe(404);
  expect((await handler(event('PUT', {}))).statusCode).toBe(400);
  const wrongType = event('PUT', emptyLibrary);
  wrongType.headers!['content-type'] = 'text/plain';
  expect((await handler(wrongType)).statusCode).toBe(415);
});

test('aceita versos opcionais e limita o tamanho antes de gravar no DynamoDB', async () => {
  const { handler } = setup();
  const card = {
    id: 'c',
    deckId: 'd',
    front: 'Pergunta',
    back: '',
    due: 0,
    interval: 0,
    reviews: 0,
  };
  const library = {
    ...emptyLibrary,
    decks: [{ id: 'd', name: 'Teste' }],
    cards: [card],
  };
  expect((await handler(event('PUT', library))).statusCode).toBe(200);
  expect(JSON.parse((await handler(event('GET'))).body).library).toEqual(
    library,
  );
  const oversized = {
    ...library,
    cards: [{ ...card, back: randomBytes(450_000).toString('base64') }],
  };
  expect((await handler(event('PUT', oversized))).statusCode).toBe(413);
});

test('capacidade excedida retorna um erro recuperável', async () => {
  const { store } = setup();
  store.get = async () => {
    throw Object.assign(new Error('throttled'), {
      name: 'ProvisionedThroughputExceededException',
    });
  };
  expect((await createHandler(store, [origin])(event('GET'))).statusCode).toBe(
    429,
  );
});
