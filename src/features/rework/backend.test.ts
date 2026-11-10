import { expect, test } from 'bun:test';
import {
  PutCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { createReworkStore, type StoredRework } from '../../../backend/rework';
import { createHandler, type HttpEvent } from '../../../backend/service';
import type { FlashcardStore } from '../../../backend/model';

function setup() {
  const items = new Map<string, StoredRework>();
  const commands: unknown[] = [];
  const client = {
    async send(command: unknown) {
      commands.push(command);
      if (command instanceof PutCommand) {
        const item = command.input.Item as StoredRework;
        if (items.has(item.pk))
          throw Object.assign(new Error('Duplicate'), {
            name: 'ConditionalCheckFailedException',
          });
        items.set(item.pk, structuredClone(item));
        return {};
      }
      if (command instanceof QueryCommand) {
        const all = [...items.values()].sort((a, b) =>
          a.pk.localeCompare(b.pk),
        );
        const after = command.input.ExclusiveStartKey?.pk;
        const start = after
          ? all.findIndex((item) => item.pk === after) + 1
          : 0;
        const page = all.slice(start, start + command.input.Limit!);
        const last = page.at(-1);
        return {
          Items: page,
          ...(start + page.length < all.length && last
            ? {
                LastEvaluatedKey: {
                  pk: last.pk,
                  library_id: last.library_id,
                  last_updated_at: last.last_updated_at,
                },
              }
            : {}),
        };
      }
      throw new Error('Comando inesperado');
    },
  } as unknown as Pick<DynamoDBDocumentClient, 'send'>;
  const fail = async () => {
    throw new Error('Não acessar cartões nem sync');
  };
  const library: FlashcardStore = { get: fail, put: fail, changes: fail };
  const handler = createHandler(
    library,
    ['https://folha.pages.dev'],
    () => new Date('2026-11-09T12:00:00.000Z'),
    undefined,
    createReworkStore(client, 'library'),
  );
  return { items, commands, handler };
}
function event(
  path = '/flashcards/builtin-patterns-factory-method-estrutura/rework',
  method = 'PUT',
): HttpEvent {
  return {
    requestContext: { http: { path, method } },
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      deck_id: 'builtin-patterns-design',
      question: 'Quem cria e quem usa?',
      source_url: 'https://refactoring.guru/design-patterns/factory-method',
    }),
  };
}

test('retry e cliques concorrentes geram uma só marcação, sem alterar cartões locais ou sync', async () => {
  const { handler, items, commands } = setup();
  const responses = await Promise.all(
    Array.from({ length: 10 }, () => handler(event())),
  );
  expect(
    responses.filter((response) => response.statusCode === 201),
  ).toHaveLength(1);
  expect(
    responses.filter((response) => response.statusCode === 200),
  ).toHaveLength(9);
  expect(items.size).toBe(1);
  const first = structuredClone([...items.values()][0]);
  const changed = event();
  changed.body = JSON.stringify({
    deck_id: 'other',
    question: 'Pergunta alterada',
  });
  expect(JSON.parse((await handler(changed)).body).already_marked).toBe(true);
  expect([...items.values()][0]).toEqual(first);
  for (const command of commands as PutCommand[]) {
    expect(command.input.ConditionExpression).toBe('attribute_not_exists(pk)');
    expect(command.input.Item?.library_id).toBe('REWORK');
    expect(command.input.Item?.pk).toBe(
      'REWORK#builtin-patterns-factory-method-estrutura',
    );
  }
});

test('listagem pagina por Query no índice existente, sem Scan e sem expor chaves internas', async () => {
  const { handler, commands } = setup();
  await handler(event('/flashcards/a/rework'));
  await handler(event('/flashcards/b/rework'));
  const firstEvent = event('/rework-requests', 'GET');
  firstEvent.queryStringParameters = { limit: '1' };
  const first = JSON.parse((await handler(firstEvent)).body);
  expect(first.requests).toHaveLength(1);
  expect(first.requests[0].flashcard_id).toBe('a');
  expect(first.requests[0]).not.toHaveProperty('pk');
  const nextEvent = event('/rework-requests', 'GET');
  nextEvent.queryStringParameters = { cursor: first.next_cursor };
  const next = JSON.parse((await handler(nextEvent)).body);
  expect(next.requests[0].flashcard_id).toBe('b');
  expect(next.next_cursor).toBeNull();
  const query = commands.find(
    (command) => command instanceof QueryCommand,
  ) as QueryCommand;
  expect(query.input).toMatchObject({
    IndexName: 'library-updated-at',
    KeyConditionExpression: 'library_id = :partition',
    ExpressionAttributeValues: { ':partition': 'REWORK' },
    Limit: 1,
  });
});

test('rota recusa origem, método, ID, metadados, tamanho e cursores inválidos antes do Dynamo', async () => {
  const { handler, commands } = setup();
  const badOrigin = event();
  badOrigin.headers!.origin = 'https://evil.example';
  expect((await handler(badOrigin)).statusCode).toBe(403);
  expect((await handler(event(undefined, 'DELETE'))).statusCode).toBe(405);
  expect((await handler(event('/rework-requests', 'PUT'))).statusCode).toBe(
    405,
  );
  expect(
    (await handler(event('/flashcards/invalid%20id/rework'))).statusCode,
  ).toBe(400);
  const badType = event();
  badType.headers = { 'content-type': 'text/plain' };
  expect((await handler(badType)).statusCode).toBe(415);
  const huge = event();
  huge.body = 'x'.repeat(16001);
  expect((await handler(huge)).statusCode).toBe(413);
  for (const body of [
    '{',
    JSON.stringify({ deck_id: 'd', question: '' }),
    JSON.stringify({
      deck_id: 'd',
      question: 'q',
      source_url: 'javascript:alert(1)',
    }),
    JSON.stringify({ deck_id: 'd', question: 'x'.repeat(2001) }),
  ]) {
    expect((await handler({ ...event(), body })).statusCode).toBe(400);
  }
  for (const query of [
    { limit: '51' },
    { cursor: '' },
    { cursor: '!' },
    {
      cursor: Buffer.from(
        JSON.stringify({
          pk: 'FLASHCARD#a',
          library_id: 'PUBLIC',
          last_updated_at: '2026-11-09T12:00:00.000Z',
        }),
      ).toString('base64url'),
    },
  ]) {
    expect(
      (
        await handler({
          ...event('/rework-requests', 'GET'),
          queryStringParameters: query,
        })
      ).statusCode,
    ).toBe(400);
  }
  expect(commands).toHaveLength(0);
});

test('corpo base64 funciona e falhas de infraestrutura não viram sucesso idempotente', async () => {
  const { handler } = setup();
  const request = event('/flashcards/personal/rework');
  request.body = Buffer.from(request.body!).toString('base64');
  request.isBase64Encoded = true;
  expect((await handler(request)).statusCode).toBe(201);
  const client = {
    async send() {
      throw Object.assign(new Error('Throttled'), {
        name: 'ThrottlingException',
      });
    },
  } as unknown as Pick<DynamoDBDocumentClient, 'send'>;
  await expect(
    createReworkStore(client, 'library').mark({
      pk: 'REWORK#a',
      library_id: 'REWORK',
      last_updated_at: '2026-11-09T12:00:00.000Z',
      flashcard_id: 'a',
      deck_id: 'd',
      question: 'Q',
      requested_at: '2026-11-09T12:00:00.000Z',
      status: 'pending',
    }),
  ).rejects.toMatchObject({ name: 'ThrottlingException' });
});
