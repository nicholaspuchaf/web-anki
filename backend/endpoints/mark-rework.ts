import { validId } from '../model';
import { REWORK_PARTITION, reworkKey, type ReworkStore } from '../rework';
import { reply, type HttpRequest, type HttpResponse } from '../http';

export async function handleMarkRework(
  { event, headers }: HttpRequest,
  id: string,
  store: ReworkStore | undefined,
  now: () => Date,
): Promise<HttpResponse> {
  if (!store)
    return reply(503, { error: 'Marcações temporariamente indisponíveis.' });
  if (!validId(id))
    return reply(400, { error: 'Identificador de cartão inválido.' });
  if (
    headers['content-type']?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return reply(415, { error: 'Envie application/json.' });
  if (!event.body || Buffer.byteLength(event.body) > 16_000)
    return reply(413, { error: 'Marcação maior que o limite permitido.' });
  let content;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    const value = JSON.parse(body);
    if (
      !value ||
      !validId(value.deck_id) ||
      typeof value.question !== 'string' ||
      !value.question.trim() ||
      value.question.length > 2000
    )
      throw new Error('dados inválidos');
    if (value.source_url !== undefined) {
      if (
        typeof value.source_url !== 'string' ||
        value.source_url.length > 2048
      )
        throw new Error('fonte inválida');
      const source = new URL(value.source_url);
      if (source.protocol !== 'https:' || source.username || source.password)
        throw new Error('fonte inválida');
      value.source_url = source.toString();
    }
    content = {
      deck_id: value.deck_id as string,
      question: value.question.trim() as string,
      ...(value.source_url ? { source_url: value.source_url as string } : {}),
    };
  } catch {
    return reply(400, {
      error:
        'Informe baralho, pergunta (até 2000 caracteres) e fonte HTTPS opcional válidos.',
    });
  }
  const timestamp = now().toISOString();
  const created = await store.mark({
    pk: reworkKey(id),
    library_id: REWORK_PARTITION,
    last_updated_at: timestamp,
    flashcard_id: id,
    ...content,
    requested_at: timestamp,
    status: 'pending',
  });
  return reply(created ? 201 : 200, {
    flashcard_id: id,
    status: 'pending',
    already_marked: !created,
  });
}
