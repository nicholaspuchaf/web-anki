import { parseBackup } from '../backup/parse-backup';
import type { CardContent, CloudCard } from './model';

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
export type SyncPage = {
  changes: CloudCard[];
  next_cursor: string | null;
  last_sync_at: string | null;
};
function isTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
export function parseCloudCard(value: unknown): CloudCard {
  if (!value || typeof value !== 'object')
    throw new Error('Cartão inválido da nuvem.');
  const record = value as CloudCard;
  if (
    typeof record.flashcard_id !== 'string' ||
    !/^[\w-]{1,128}$/.test(record.flashcard_id) ||
    !Number.isSafeInteger(record.version) ||
    record.version < 1 ||
    !isTimestamp(record.last_updated_at)
  )
    throw new Error('Versão ou data inválida da nuvem.');
  const common = {
    flashcard_id: record.flashcard_id,
    version: record.version,
    last_updated_at: record.last_updated_at,
  };
  if (record.deleted_at !== null) {
    if (
      !isTimestamp(record.deleted_at) ||
      record.deleted_at !== record.last_updated_at
    )
      throw new Error('Exclusão inválida da nuvem.');
    return { ...common, deleted_at: record.deleted_at };
  }
  const parsed = parseBackup(
    JSON.stringify({ version: 1, cards: [record.card], decks: [record.deck] }),
  );
  if (parsed.cards[0].id !== record.flashcard_id)
    throw new Error('Identificador inválido da nuvem.');
  return {
    ...common,
    deleted_at: null,
    card: parsed.cards[0],
    deck: parsed.decks[0],
  };
}
export function createCloudApi(baseUrl: string, request: HttpRequest = fetch) {
  const base = baseUrl.replace(/\/+$/, '');
  async function send(
    path: string,
    method = 'GET',
    content?: CardContent,
    version?: number,
  ) {
    const response = await request(`${base}${path}`, {
      method,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
      ...(method !== 'GET'
        ? {
            headers: {
              'content-type': 'application/json',
              'if-match': String(version),
            },
            ...(content ? { body: JSON.stringify(content) } : {}),
          }
        : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new CloudError(
        typeof data?.error === 'string'
          ? data.error
          : 'Não foi possível sincronizar.',
        response.status,
      );
    return data;
  }
  async function mutation(
    id: string,
    method: string,
    version: number,
    content?: CardContent,
  ) {
    const result = parseCloudCard(
      await send(
        `/flashcards/${encodeURIComponent(id)}`,
        method,
        content,
        version,
      ),
    );
    if (
      result.flashcard_id !== id ||
      result.version < version ||
      (method === 'PUT'
        ? result.deleted_at !== null || result.version !== version + 1
        : result.deleted_at === null)
    )
      throw new Error('Confirmação inválida da nuvem.');
    return result;
  }
  return {
    async changes(
      options: { since?: string; cursor?: string } = {},
    ): Promise<SyncPage> {
      const params = new URLSearchParams(options);
      const data = await send(`/sync${params.size ? `?${params}` : ''}`);
      if (
        !data ||
        !Array.isArray(data.changes) ||
        !(
          data.next_cursor === null ||
          (typeof data.next_cursor === 'string' &&
            data.next_cursor.length > 0 &&
            data.next_cursor.length <= 2048)
        ) ||
        (data.next_cursor !== null
          ? data.last_sync_at !== null
          : !isTimestamp(data.last_sync_at))
      )
        throw new Error('Página de sincronização inválida.');
      return {
        changes: data.changes.map(parseCloudCard),
        next_cursor: data.next_cursor,
        last_sync_at: data.last_sync_at,
      };
    },
    async get(id: string) {
      const result = parseCloudCard(
        await send(`/flashcards/${encodeURIComponent(id)}`),
      );
      if (result.flashcard_id !== id)
        throw new Error('Identificador inválido da nuvem.');
      return result;
    },
    put(id: string, content: CardContent, version: number) {
      return mutation(id, 'PUT', version, content);
    },
    delete(id: string, version: number) {
      return mutation(id, 'DELETE', version);
    },
  };
}
export type CloudApi = ReturnType<typeof createCloudApi>;
