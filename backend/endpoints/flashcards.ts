import {
  LIBRARY_ID,
  MAX_CARD_BYTES,
  cardKey,
  parseCard,
  publicCard,
  validId,
  type FlashcardStore,
  type StoredFlashcard,
} from '../model';
import { isBundledId } from '../../src/features/bundled-decks/ids';
import { canSyncCard } from '../../src/features/library/sync-policy';
import { reply, type HttpRequest, type HttpResponse } from '../http';

export async function handleFlashcards(
  request: HttpRequest,
  id: string,
  store: FlashcardStore,
  now: () => Date,
): Promise<HttpResponse> {
  const { event, method, headers } = request;
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
}
