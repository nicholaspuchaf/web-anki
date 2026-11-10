import type { Card } from '../library/model';
import type { ReworkRequest } from '../../../backend/rework';
import type { HttpRequest } from '../sync/api';

export function apiBase(value: string): string {
  const url = new URL(value);
  if (
    (url.protocol !== 'https:' &&
      !(
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      )) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Informe uma URL HTTPS da API (ou HTTP em localhost).');
  return url.toString().replace(/\/+$/, '');
}
async function payload(response: Response): Promise<Record<string, unknown>> {
  let value;
  try {
    value = await response.json();
  } catch {
    throw new Error(`Resposta inválida da API (HTTP ${response.status}).`);
  }
  if (!response.ok)
    throw new Error(
      typeof value?.error === 'string'
        ? value.error
        : `A API respondeu HTTP ${response.status}.`,
    );
  if (!value || typeof value !== 'object')
    throw new Error('Resposta inválida da API.');
  return value;
}
export async function markForRework(
  base: string,
  card: Card,
  request: HttpRequest = fetch,
): Promise<void> {
  const source = card.sourceUrl || card.leetcode?.url;
  const result = await payload(
    await request(
      `${apiBase(base)}/flashcards/${encodeURIComponent(card.id)}/rework`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          deck_id: card.deckId,
          question: card.front.trim().slice(0, 2000),
          ...(source ? { source_url: source } : {}),
        }),
        signal: AbortSignal.timeout(20_000),
        cache: 'no-store',
      },
    ),
  );
  if (
    result.flashcard_id !== card.id ||
    result.status !== 'pending' ||
    typeof result.already_marked !== 'boolean'
  )
    throw new Error('A API não confirmou a marcação. Tente novamente.');
}
export async function listReworkRequests(
  base: string,
  request: HttpRequest = fetch,
): Promise<ReworkRequest[]> {
  const endpoint = `${apiBase(base)}/rework-requests`;
  const items = new Map<string, ReworkRequest>();
  const cursors = new Set<string>();
  let cursor: string | null = null;
  do {
    const url = new URL(endpoint);
    url.searchParams.set('limit', '50');
    if (cursor) url.searchParams.set('cursor', cursor);
    const page = await payload(
      await request(url.toString(), {
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      }),
    );
    if (
      !Array.isArray(page.requests) ||
      !(
        page.next_cursor === null ||
        (typeof page.next_cursor === 'string' &&
          /^[\w-]{1,2048}$/.test(page.next_cursor))
      )
    )
      throw new Error('Página de marcações inválida.');
    for (const value of page.requests) {
      if (
        !value ||
        typeof value.flashcard_id !== 'string' ||
        !/^[\w-]{1,128}$/.test(value.flashcard_id) ||
        typeof value.deck_id !== 'string' ||
        !/^[\w-]{1,128}$/.test(value.deck_id) ||
        typeof value.question !== 'string' ||
        !value.question.trim() ||
        value.question.length > 2000 ||
        value.status !== 'pending' ||
        typeof value.requested_at !== 'string' ||
        !Number.isFinite(Date.parse(value.requested_at)) ||
        (value.source_url !== undefined &&
          (typeof value.source_url !== 'string' ||
            !value.source_url.startsWith('https://')))
      )
        throw new Error('Marcação inválida recebida da API.');
      items.set(value.flashcard_id, value as ReworkRequest);
    }
    cursor = page.next_cursor as string | null;
    if (cursor) {
      if (cursors.has(cursor))
        throw new Error(
          'A API repetiu um cursor. A exportação foi interrompida.',
        );
      cursors.add(cursor);
    }
  } while (cursor);
  return [...items.values()];
}
