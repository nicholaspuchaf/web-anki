import { validId, validTimestamp } from '../model';
import { REWORK_PARTITION, type ReworkKey, type ReworkStore } from '../rework';
import { reply, type HttpRequest, type HttpResponse } from '../http';

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

export async function handleListRework(
  { event }: HttpRequest,
  store: ReworkStore | undefined,
): Promise<HttpResponse> {
  if (!store)
    return reply(503, { error: 'Marcações temporariamente indisponíveis.' });
  let query;
  try {
    query = pageQuery(event.queryStringParameters ?? {});
  } catch {
    return reply(400, { error: 'Use limit entre 1 e 50 e um cursor válido.' });
  }
  const page = await store.list(query.limit, query.after);
  return reply(200, {
    requests: page.items,
    next_cursor: page.next
      ? Buffer.from(JSON.stringify(page.next)).toString('base64url')
      : null,
  });
}
