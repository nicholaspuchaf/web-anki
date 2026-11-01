import {
  DEFAULT_PAGE_SIZE,
  LIBRARY_ID,
  MAX_PAGE_SIZE,
  SYNC_OVERLAP_MS,
  cardKey,
  validId,
  validTimestamp,
  type ChangeQuery,
  type PageKey,
} from './model';

type Cursor = {
  from: string;
  until: string;
  limit: number;
  after?: PageKey;
};
export function encodeCursor(query: ChangeQuery, after: PageKey): string {
  return Buffer.from(JSON.stringify({ ...query, after })).toString('base64url');
}
export function syncQuery(
  params: Record<string, string | undefined>,
  now: string,
): ChangeQuery {
  if (params.cursor !== undefined) {
    if (params.since !== undefined || params.limit !== undefined)
      throw new Error('Use somente cursor para continuar a paginação.');
    if (params.cursor.length > 2048 || !/^[\w-]+$/.test(params.cursor))
      throw new Error('Cursor inválido.');
    const value = JSON.parse(
      Buffer.from(params.cursor, 'base64url').toString('utf8'),
    ) as Cursor;
    if (
      !value ||
      !validTimestamp(value.from) ||
      !validTimestamp(value.until) ||
      value.from > value.until ||
      value.until > now ||
      !Number.isInteger(value.limit) ||
      value.limit < 1 ||
      value.limit > MAX_PAGE_SIZE ||
      !value.after ||
      value.after.library_id !== LIBRARY_ID ||
      typeof value.after.pk !== 'string' ||
      !validId(value.after.pk.slice(10)) ||
      value.after.pk !== cardKey(value.after.pk.slice(10)) ||
      !validTimestamp(value.after.last_updated_at) ||
      value.after.last_updated_at < value.from ||
      value.after.last_updated_at > value.until
    )
      throw new Error('Cursor inválido.');
    return {
      from: value.from,
      until: value.until,
      limit: value.limit,
      after: {
        pk: value.after.pk,
        library_id: LIBRARY_ID,
        last_updated_at: value.after.last_updated_at,
      },
    };
  }
  const since = params.since;
  if (since !== undefined && (!validTimestamp(since) || since > now))
    throw new Error(
      'since deve ser uma data UTC válida, recebida do servidor.',
    );
  const limit =
    params.limit === undefined ? DEFAULT_PAGE_SIZE : Number(params.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)
    throw new Error('limit deve ser um inteiro entre 1 e 50.');
  return {
    from: new Date(
      since ? Math.max(0, Date.parse(since) - SYNC_OVERLAP_MS) : 0,
    ).toISOString(),
    until: now,
    limit,
  };
}
