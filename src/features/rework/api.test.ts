import { expect, test } from 'bun:test';
import { apiBase, listReworkRequests, markForRework } from './api';

const entry = {
  flashcard_id: 'builtin-mc714-tcp-handoff-1',
  deck_id: 'builtin-mc714',
  question: 'O que é TCP handoff?',
  requested_at: '2026-11-09T12:00:00.000Z',
  status: 'pending' as const,
};
test('cliente pagina, deduplica IDs e não trata falha ou cursor repetido como exportação completa', async () => {
  const urls: string[] = [];
  const rows = await listReworkRequests(
    'https://api.example/',
    async (input) => {
      urls.push(String(input));
      return Response.json({
        requests: [entry],
        next_cursor: urls.length === 1 ? 'next' : null,
      });
    },
  );
  expect(rows).toEqual([entry]);
  expect(urls).toEqual([
    'https://api.example/rework-requests?limit=50',
    'https://api.example/rework-requests?limit=50&cursor=next',
  ]);
  await expect(
    listReworkRequests('https://api.example', async () =>
      Response.json({ requests: [entry], next_cursor: 'same' }),
    ),
  ).rejects.toThrow('repetiu um cursor');
  await expect(
    listReworkRequests('https://api.example', async () =>
      Response.json({ error: 'Aguarde' }, { status: 429 }),
    ),
  ).rejects.toThrow('Aguarde');
  await expect(
    listReworkRequests('https://api.example', async () =>
      Response.json({
        requests: [{ ...entry, flashcard_id: null }],
        next_cursor: null,
      }),
    ),
  ).rejects.toThrow('Marcação inválida');
});

test('marcação envia só identificação, pergunta e fonte, sem respostas ou progresso', async () => {
  const card = {
    id: entry.flashcard_id,
    deckId: entry.deck_id,
    front: 'x'.repeat(3000),
    back: 'Não enviar',
    reviews: 7,
    due: 100,
    interval: 3,
    sourceUrl: 'https://example.com/source',
    syncEnabled: false,
  };
  await markForRework('https://api.example', card, async (input, options) => {
    expect(String(input)).toBe(
      `https://api.example/flashcards/${card.id}/rework`,
    );
    expect(options?.method).toBe('PUT');
    expect(JSON.parse(options!.body as string)).toEqual({
      deck_id: card.deckId,
      question: 'x'.repeat(2000),
      source_url: card.sourceUrl,
    });
    return Response.json({
      flashcard_id: card.id,
      status: 'pending',
      already_marked: true,
    });
  });
  await expect(
    markForRework('https://api.example', card, async () => Response.json({})),
  ).rejects.toThrow('não confirmou');
  for (const url of [
    'file:///tmp/api',
    'http://remote.example',
    'https://u:p@api.example',
    'https://api.example?secret=x',
  ])
    expect(() => apiBase(url)).toThrow();
});

test('script local coleta todas as páginas e emite apenas JSON, com erro de saída em falhas', async () => {
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === '/bad/rework-requests')
        return Response.json({ error: 'Indisponível' }, { status: 503 });
      return Response.json({
        requests: url.searchParams.has('cursor')
          ? [{ ...entry, flashcard_id: 'second' }]
          : [entry],
        next_cursor: url.searchParams.has('cursor') ? null : 'next',
      });
    },
  });
  try {
    const run = async (url: string) => {
      const child = Bun.spawn(
        [process.execPath, 'scripts/list-rework.ts', url],
        { stdout: 'pipe', stderr: 'pipe' },
      );
      const [stdout, stderr, exit] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      return { stdout, stderr, exit };
    };
    const success = await run(server.url.toString());
    expect(success.exit).toBe(0);
    expect(success.stderr).toBe('');
    expect(JSON.parse(success.stdout)).toMatchObject({
      count: 2,
      requests: [entry, { ...entry, flashcard_id: 'second' }],
    });
    const failure = await run(new URL('bad', server.url).toString());
    expect(failure.exit).toBe(1);
    expect(failure.stdout).toBe('');
    expect(failure.stderr).toContain('Indisponível');
  } finally {
    server.stop(true);
  }
});
