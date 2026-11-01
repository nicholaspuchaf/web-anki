import { createHandler, type HttpEvent } from '../../backend/service';
import type { FlashcardStore, StoredFlashcard } from '../../backend/model';
import { createCloudApi, type HttpRequest } from '../../src/features/sync/api';

export const ORIGIN = 'https://folha.pages.dev';
export const API_URL = 'https://folha-api.example';
export const START = '2026-11-01T10:00:00.000Z';
export function cloudFixture(origins: string[] = [ORIGIN]) {
  let time = Date.parse(START);
  const records = new Map<string, StoredFlashcard>();
  const calls: Array<{
    path: string;
    method: string;
    query: Record<string, string>;
  }> = [];
  const store: FlashcardStore = {
    async get(id) {
      return records.get(id) ?? null;
    },
    async put(item, version) {
      if ((records.get(item.flashcard_id)?.version ?? 0) !== version)
        return false;
      records.set(item.flashcard_id, structuredClone(item));
      return true;
    },
    async changes(query) {
      const items = [...records.values()]
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
        ? items.findIndex((item) => item.pk === query.after!.pk) + 1
        : 0;
      const page = items.slice(offset, offset + query.limit);
      const last = page.at(-1);
      return {
        items: page,
        ...(last && offset + page.length < items.length
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
  const handler = createHandler(store, origins, () => new Date(time));
  async function dispatch(event: HttpEvent) {
    calls.push({
      path: event.rawPath ?? event.requestContext.http.path,
      method: event.requestContext.http.method,
      query: (event.queryStringParameters as Record<string, string>) ?? {},
    });
    return handler(event);
  }
  const request: HttpRequest = async (input, options) => {
    const url = new URL(String(input));
    const result = await dispatch({
      requestContext: {
        http: { method: options?.method ?? 'GET', path: url.pathname },
      },
      headers: Object.fromEntries(new Headers(options?.headers)),
      queryStringParameters: Object.fromEntries(url.searchParams),
      body: options?.body as string | undefined,
    });
    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers,
    });
  };
  return {
    records,
    store,
    calls,
    dispatch,
    request,
    api: createCloudApi(API_URL, request),
    advance(ms = 1000) {
      time += ms;
    },
    now: () => time,
  };
}
