import { handleRework, type ReworkStore } from './rework';
import {
  LIBRARY_ID,
  MAX_CARD_BYTES,
  SYNC_OVERLAP_MS,
  cardKey,
  parseCard,
  publicCard,
  validId,
  type FlashcardStore,
  type StoredFlashcard,
} from './model';
import { isBundledId } from '../src/features/bundled-decks/ids';
import { canSyncCard } from '../src/features/library/sync-policy';
import { encodeCursor, syncQuery } from './sync';
import { loadProblem, ProblemImportError } from './leetcode';

export type HttpEvent = {
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined>;
  requestContext: { http: { method: string; path: string } };
  rawPath?: string;
};
export type HttpResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};
function reply(statusCode: number, body: unknown): HttpResponse {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: statusCode === 204 ? '' : JSON.stringify(body),
  };
}
export function createHandler(
  store: FlashcardStore,
  origins: string[],
  now: () => Date = () => new Date(),
  importProblem = loadProblem,
  reworkStore?: ReworkStore,
) {
  return async (event: HttpEvent): Promise<HttpResponse> => {
    const method = event.requestContext.http.method;
    const path = event.rawPath ?? event.requestContext.http.path;
    const headers = Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
    if (headers.origin && !origins.includes(headers.origin))
      return reply(403, { error: 'Origem não permitida.' });
    if (method === 'OPTIONS') return reply(204, null);
    if (path === '/library')
      return reply(410, {
        error:
          'O protocolo de biblioteca inteira foi substituído por /sync e /flashcards/:id. Atualize o cliente.',
      });
    const problem = /^\/leetcode\/problems\/([^/]+)$/.exec(path);
    if (problem) {
      if (method !== 'GET')
        return reply(405, { error: 'Método não permitido.' });
      try {
        return reply(200, await importProblem(problem[1]));
      } catch (cause) {
        if (cause instanceof ProblemImportError)
          return reply(cause.status, { error: cause.message });
        return reply(502, {
          error: 'Não foi possível consultar o LeetCode agora.',
        });
      }
    }
    const rework =
      path === '/rework-requests' || /^\/flashcards\/[^/]+\/rework$/.test(path);
    const match = /^\/flashcards\/([^/]+)$/.exec(path);
    if (path !== '/sync' && !match && !rework)
      return reply(404, { error: 'Rota não encontrada.' });
    if (
      !rework &&
      (path === '/sync'
        ? method !== 'GET'
        : !['GET', 'PUT', 'DELETE'].includes(method))
    )
      return reply(405, { error: 'Método não permitido.' });
    try {
      if (rework) {
        const result = await handleRework(event, headers, reworkStore, now);
        return reply(result.status, result.body);
      }
      if (path === '/sync') {
        let query;
        try {
          query = syncQuery(
            event.queryStringParameters ?? {},
            now().toISOString(),
          );
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
      const id = match![1];
      if (!validId(id))
        return reply(400, { error: 'Identificador de cartão inválido.' });
      if (isBundledId(id))
        return reply(403, {
          error: 'Cartões incluídos no site não são armazenados na nuvem.',
        });
      if (method === 'GET') {
        const current = await store.get(id);
        return current
          ? reply(200, publicCard(current))
          : reply(404, { error: 'Cartão não encontrado.' });
      }
      const expected = headers['if-match'];
      if (!expected || !/^(0|[1-9]\d{0,14})$/.test(expected))
        return reply(428, {
          error: 'Informe a versão do cartão em If-Match; use 0 para criar.',
        });
      const expectedVersion = Number(expected);
      let content;
      if (method === 'PUT') {
        if (
          headers['content-type']?.split(';')[0].trim().toLowerCase() !==
          'application/json'
        )
          return reply(415, { error: 'Envie application/json.' });
        if (
          !event.body ||
          Buffer.byteLength(event.body, 'utf8') > MAX_CARD_BYTES * 1.4
        )
          return reply(413, { error: 'Cartão maior que o limite de 250 KB.' });
        const body = event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString('utf8')
          : event.body;
        if (Buffer.byteLength(body, 'utf8') > MAX_CARD_BYTES)
          return reply(413, { error: 'Cartão maior que o limite de 250 KB.' });
        try {
          content = parseCard(body, id);
        } catch {
          return reply(400, { error: 'Cartão ou baralho inválido.' });
        }
        if (Buffer.byteLength(JSON.stringify(content), 'utf8') > MAX_CARD_BYTES)
          return reply(413, { error: 'Cartão maior que o limite de 250 KB.' });
      }
      if (
        content &&
        !canSyncCard(
          { version: 1, cards: [content.card], decks: [content.deck] },
          id,
        )
      )
        return reply(403, {
          error: 'Este baralho ou cartão está marcado como local.',
        });
      const current = await store.get(id);
      if ((current?.version ?? 0) !== expectedVersion)
        return reply(409, {
          error:
            'O cartão mudou em outro aparelho. Busque a versão atual antes de tentar novamente.',
        });
      if (method === 'DELETE' && !current)
        return reply(404, { error: 'Cartão não encontrado.' });
      if (method === 'DELETE' && current?.deleted_at)
        return reply(200, publicCard(current));
      const timestamp = new Date(
        Math.max(
          now().getTime(),
          current ? Date.parse(current.last_updated_at) + 1 : 0,
        ),
      ).toISOString();
      const common = {
        pk: cardKey(id),
        library_id: LIBRARY_ID,
        flashcard_id: id,
        last_updated_at: timestamp,
        version: expectedVersion + 1,
      } as const;
      const item: StoredFlashcard = content
        ? { ...common, deleted_at: null, ...content }
        : { ...common, deleted_at: timestamp };
      if (!(await store.put(item, expectedVersion)))
        return reply(409, {
          error: 'O cartão mudou durante a gravação. Busque a versão atual.',
        });
      return reply(current ? 200 : 201, publicCard(item));
    } catch (error) {
      const name = error instanceof Error ? error.name : 'UnknownError';
      if (
        [
          'ProvisionedThroughputExceededException',
          'ThrottlingException',
          'RequestLimitExceeded',
        ].includes(name)
      )
        return reply(429, {
          error: 'Muitas operações. Aguarde um momento e tente novamente.',
        });
      console.error('Flashcard request failed', { name });
      return reply(500, {
        error: 'Não foi possível acessar os cartões agora.',
      });
    }
  };
}
