import { parseBackup } from '../backup/parse-backup';
import type { Library } from '../library/model';
export type CloudSnapshot = {
  revision: string;
  updatedAt: string | null;
  library: Library;
};
export class CloudError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export type HttpRequest = (
  input: RequestInfo | URL,
  options?: RequestInit,
) => Promise<Response>;
export function createCloudApi(baseUrl: string, request: HttpRequest = fetch) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/library`;
  async function send(
    method: 'GET' | 'PUT',
    library?: Library,
    revision?: string,
  ) {
    const response = await request(endpoint, {
      method,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
      ...(method === 'PUT'
        ? {
            headers: {
              'content-type': 'application/json',
              'if-match': revision!,
            },
            body: JSON.stringify(library),
          }
        : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new CloudError(
        typeof data.error === 'string'
          ? data.error
          : 'Não foi possível sincronizar.',
        response.status,
      );
    if (
      typeof data.revision !== 'string' ||
      (data.updatedAt !== null && typeof data.updatedAt !== 'string')
    )
      throw new Error('Resposta inválida da nuvem.');
    return data as {
      revision: string;
      updatedAt: string | null;
      library?: unknown;
    };
  }
  return {
    async get(): Promise<CloudSnapshot> {
      const result = await send('GET');
      return {
        revision: result.revision,
        updatedAt: result.updatedAt,
        library: parseBackup(JSON.stringify(result.library)),
      };
    },
    async put(library: Library, revision: string) {
      const result = await send('PUT', library, revision);
      return { revision: result.revision, updatedAt: result.updatedAt };
    },
  };
}
