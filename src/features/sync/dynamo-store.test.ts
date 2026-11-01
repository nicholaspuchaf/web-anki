import { expect, test } from 'bun:test';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { createDynamoStore } from '../../../backend/store';
import {
  LIBRARY_ID,
  SYNC_INDEX,
  type StoredFlashcard,
  type PageKey,
} from '../../../backend/model';

function setup(respond: (command: unknown) => unknown = () => ({})) {
  const commands: unknown[] = [];
  const client = {
    async send(command: unknown) {
      commands.push(command);
      return respond(command);
    },
  } as unknown as Pick<DynamoDBDocumentClient, 'send'>;
  return { commands, store: createDynamoStore(client, 'test-library') };
}
const tombstone: StoredFlashcard = {
  pk: 'FLASHCARD#c',
  library_id: LIBRARY_ID,
  flashcard_id: 'c',
  version: 2,
  last_updated_at: '2026-11-01T10:00:00.000Z',
  deleted_at: '2026-11-01T10:00:00.000Z',
};
test('adaptador lê por ID com consistência forte e usa condição atômica de versão', async () => {
  const { store, commands } = setup((command) =>
    command instanceof GetCommand ? { Item: tombstone } : {},
  );
  expect(await store.get('c')).toEqual(tombstone);
  expect((commands[0] as GetCommand).input).toMatchObject({
    Key: { pk: 'FLASHCARD#c' },
    ConsistentRead: true,
  });
  await store.put(tombstone, 0);
  expect((commands[1] as PutCommand).input.ConditionExpression).toBe(
    'attribute_not_exists(pk)',
  );
  await store.put(tombstone, 1);
  expect((commands[2] as PutCommand).input).toMatchObject({
    ConditionExpression: '#version = :expected',
    ExpressionAttributeValues: { ':expected': 1 },
  });
});
test('sync usa Query com intervalo inclusivo no índice e paginação nativa, sem Scan ou filtro', async () => {
  const key: PageKey = {
    pk: tombstone.pk,
    library_id: LIBRARY_ID,
    last_updated_at: tombstone.last_updated_at,
  };
  const { store, commands } = setup(() => ({
    Items: [tombstone],
    LastEvaluatedKey: key,
  }));
  const query = {
    from: '2026-11-01T09:58:00.000Z',
    until: '2026-11-01T10:01:00.000Z',
    limit: 2,
    after: key,
  };
  expect(await store.changes(query)).toEqual({ items: [tombstone], next: key });
  expect(commands[0]).toBeInstanceOf(QueryCommand);
  const input = (commands[0] as QueryCommand).input;
  expect(input).toMatchObject({
    TableName: 'test-library',
    IndexName: SYNC_INDEX,
    Limit: 2,
    ExclusiveStartKey: key,
    KeyConditionExpression:
      'library_id = :library AND last_updated_at BETWEEN :from AND :until',
    ExpressionAttributeValues: {
      ':library': LIBRARY_ID,
      ':from': query.from,
      ':until': query.until,
    },
  });
  expect(input.FilterExpression).toBeUndefined();
  expect(input.ConsistentRead).toBeUndefined();
});
test('falha condicional vira conflito, enquanto falha de infraestrutura é propagada', async () => {
  const conflict = setup(() => {
    throw Object.assign(new Error('conflict'), {
      name: 'ConditionalCheckFailedException',
    });
  });
  expect(await conflict.store.put(tombstone, 1)).toBe(false);
  const failure = setup(() => {
    throw new Error('unavailable');
  });
  await expect(failure.store.put(tombstone, 1)).rejects.toThrow('unavailable');
});
