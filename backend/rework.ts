import {
  PutCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { SYNC_INDEX, validId, validTimestamp } from './model';
import type { HttpEvent } from './service';

export const REWORK_PARTITION = 'REWORK';
export type ReworkRequest = {
  flashcard_id: string;
  deck_id: string;
  question: string;
  source_url?: string;
  requested_at: string;
  status: 'pending';
};
export type ReworkKey = {
  pk: string;
  library_id: typeof REWORK_PARTITION;
  last_updated_at: string;
};
export type StoredRework = ReworkRequest & ReworkKey;
export interface ReworkStore {
  mark(item: StoredRework): Promise<boolean>;
  list(
    limit: number,
    after?: ReworkKey,
  ): Promise<{ items: ReworkRequest[]; next?: ReworkKey }>;
}
export const reworkKey = (id: string) => `REWORK#${id}`;
export function createReworkStore(
  client: Pick<DynamoDBDocumentClient, 'send'>,
  table: string,
): ReworkStore {
  return {
    async mark(item) {
      try {
        await client.send(
          new PutCommand({
            TableName: table,
            Item: item,
            ConditionExpression: 'attribute_not_exists(pk)',
          }),
        );
        return true;
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'ConditionalCheckFailedException'
        )
          return false;
        throw error;
      }
    },
    async list(limit, after) {
      const result = await client.send(
        new QueryCommand({
          TableName: table,
          IndexName: SYNC_INDEX,
          KeyConditionExpression: 'library_id = :partition',
          ExpressionAttributeValues: { ':partition': REWORK_PARTITION },
          Limit: limit,
          ScanIndexForward: true,
          ...(after ? { ExclusiveStartKey: after } : {}),
        }),
      );
      // Select public fields explicitly: the sync keys are not part of this API.
      const items = ((result.Items ?? []) as StoredRework[]).map((item) => ({
        flashcard_id: item.flashcard_id,
        deck_id: item.deck_id,
        question: item.question,
        ...(item.source_url ? { source_url: item.source_url } : {}),
        requested_at: item.requested_at,
        status: item.status,
      }));
      return {
        items,
        ...(result.LastEvaluatedKey
          ? { next: result.LastEvaluatedKey as ReworkKey }
          : {}),
      };
    },
  };
}

function pageQuery(params: Record<string, string | undefined>): {
  limit: number;
  after?: ReworkKey;
} {
  const limit = params.limit === undefined ? 50 : Number(params.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    throw new Error('limit inválido');
  if (params.cursor === undefined) return { limit };
  if (params.cursor.length > 2048 || !/^[\w-]+$/.test(params.cursor))
    throw new Error('cursor inválido');
  const key = JSON.parse(
    Buffer.from(params.cursor, 'base64url').toString('utf8'),
  ) as ReworkKey;
  if (
    !key ||
    key.library_id !== REWORK_PARTITION ||
    typeof key.pk !== 'string' ||
    !key.pk.startsWith('REWORK#') ||
    !validId(key.pk.slice(7)) ||
    !validTimestamp(key.last_updated_at)
  )
    throw new Error('cursor inválido');
  return {
    limit,
    after: {
      pk: key.pk,
      library_id: REWORK_PARTITION,
      last_updated_at: key.last_updated_at,
    },
  };
}
export async function handleRework(
  event: HttpEvent,
  headers: Record<string, string | undefined>,
  store: ReworkStore | undefined,
  now: () => Date,
): Promise<{ status: number; body: unknown }> {
  const method = event.requestContext.http.method;
  const path = event.rawPath ?? event.requestContext.http.path;
  const listing = path === '/rework-requests';
  if (method !== (listing ? 'GET' : 'PUT'))
    return { status: 405, body: { error: 'Método não permitido.' } };
  if (!store)
    return {
      status: 503,
      body: { error: 'Marcações temporariamente indisponíveis.' },
    };
  if (listing) {
    let query;
    try {
      query = pageQuery(event.queryStringParameters ?? {});
    } catch {
      return {
        status: 400,
        body: { error: 'Use limit entre 1 e 50 e um cursor válido.' },
      };
    }
    const page = await store.list(query.limit, query.after);
    return {
      status: 200,
      body: {
        requests: page.items,
        next_cursor: page.next
          ? Buffer.from(JSON.stringify(page.next)).toString('base64url')
          : null,
      },
    };
  }
  const id = /^\/flashcards\/([^/]+)\/rework$/.exec(path)?.[1];
  if (!validId(id))
    return {
      status: 400,
      body: { error: 'Identificador de cartão inválido.' },
    };
  if (
    headers['content-type']?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return { status: 415, body: { error: 'Envie application/json.' } };
  if (!event.body || Buffer.byteLength(event.body) > 16_000)
    return {
      status: 413,
      body: { error: 'Marcação maior que o limite permitido.' },
    };
  let content;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    const value = JSON.parse(body);
    if (
      !value ||
      !validId(value.deck_id) ||
      typeof value.question !== 'string' ||
      !value.question.trim() ||
      value.question.length > 2000
    )
      throw new Error('dados inválidos');
    if (value.source_url !== undefined) {
      if (
        typeof value.source_url !== 'string' ||
        value.source_url.length > 2048
      )
        throw new Error('fonte inválida');
      const source = new URL(value.source_url);
      if (source.protocol !== 'https:' || source.username || source.password)
        throw new Error('fonte inválida');
      value.source_url = source.toString();
    }
    content = {
      deck_id: value.deck_id as string,
      question: value.question.trim() as string,
      ...(value.source_url ? { source_url: value.source_url as string } : {}),
    };
  } catch {
    return {
      status: 400,
      body: {
        error:
          'Informe baralho, pergunta (até 2000 caracteres) e fonte HTTPS opcional válidos.',
      },
    };
  }
  const timestamp = now().toISOString();
  const created = await store.mark({
    pk: reworkKey(id),
    library_id: REWORK_PARTITION,
    last_updated_at: timestamp,
    flashcard_id: id,
    ...content,
    requested_at: timestamp,
    status: 'pending',
  });
  return {
    status: created ? 201 : 200,
    body: { flashcard_id: id, status: 'pending', already_marked: !created },
  };
}
