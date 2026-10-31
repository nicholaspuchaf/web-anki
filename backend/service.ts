import { randomUUID } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { parseBackup } from '../src/features/backup/parse-backup';
import { emptyLibrary, type Library } from '../src/features/library/model';

export const MAX_BODY_BYTES = 2_000_000;
export const MAX_SNAPSHOT_BYTES = 300_000;
export type Snapshot = {
  revision: string;
  updatedAt: string | null;
  library: Library;
};
export type StoredSnapshot = {
  revision: string;
  updatedAt: string;
  data: Uint8Array;
};
export interface SnapshotStore {
  get(): Promise<StoredSnapshot | null>;
  put(snapshot: StoredSnapshot, expectedRevision: string): Promise<boolean>;
}
export type HttpEvent = {
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
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
export function createHandler(store: SnapshotStore, origins: string[]) {
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
    if (path !== '/library')
      return reply(404, { error: 'Rota não encontrada.' });
    if (!['GET', 'PUT'].includes(method))
      return reply(405, { error: 'Método não permitido.' });
    try {
      if (method === 'GET') {
        const current = await store.get();
        const snapshot: Snapshot = current
          ? {
              revision: current.revision,
              updatedAt: current.updatedAt,
              library: parseBackup(
                gunzipSync(current.data, {
                  maxOutputLength: MAX_BODY_BYTES,
                }).toString('utf8'),
              ),
            }
          : { revision: '0', updatedAt: null, library: emptyLibrary };
        return reply(200, snapshot);
      }
      const expected = headers['if-match'];
      if (!expected || !/^(0|[0-9a-f-]{36})$/.test(expected))
        return reply(428, {
          error: 'Verifique a versão da biblioteca antes de enviar.',
        });
      if (
        !headers['content-type']?.toLowerCase().startsWith('application/json')
      )
        return reply(415, { error: 'Envie application/json.' });
      if (
        !event.body ||
        Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES * 1.4
      )
        return reply(413, {
          error: 'Biblioteca maior que o limite de sincronização.',
        });
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES)
        return reply(413, { error: 'Biblioteca maior que 2 MB.' });
      let library: Library;
      try {
        library = parseBackup(body);
      } catch {
        return reply(400, {
          error: 'Biblioteca inválida. Confira os dados enviados.',
        });
      }
      const data = gzipSync(JSON.stringify(library));
      if (data.byteLength > MAX_SNAPSHOT_BYTES)
        return reply(413, {
          error:
            'Biblioteca maior que 300 KB compactados. Use backup JSON para preservar os dados.',
        });
      const stored = {
        revision: randomUUID(),
        updatedAt: new Date().toISOString(),
        data,
      };
      if (!(await store.put(stored, expected)))
        return reply(409, {
          error:
            'A biblioteca foi alterada em outro aparelho. Verifique a nuvem novamente.',
        });
      return reply(200, {
        revision: stored.revision,
        updatedAt: stored.updatedAt,
      });
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
      console.error('Library request failed', { name });
      return reply(500, {
        error: 'Não foi possível acessar a biblioteca agora.',
      });
    }
  };
}
