import { SYNC_OVERLAP_MS, publicCard, type FlashcardStore } from '../model';
import { encodeCursor, syncQuery } from '../sync';
import { reply, type HttpRequest, type HttpResponse } from '../http';

export async function handleSync(
  { event }: HttpRequest,
  store: FlashcardStore,
  now: () => Date,
): Promise<HttpResponse> {
  let query;
  try {
    query = syncQuery(event.queryStringParameters ?? {}, now().toISOString());
  } catch {
    return reply(400, {
      error:
        'Parâmetros de sincronização inválidos. Use since UTC, limit entre 1 e 50, ou somente cursor.',
    });
  }
  const page = await store.changes(query);
  return reply(200, {
    changes: page.items.map(publicCard),
    next_cursor: page.next ? encodeCursor(query, page.next) : null,
    last_sync_at: page.next ? null : query.until,
    overlap_seconds: SYNC_OVERLAP_MS / 1000,
  });
}
