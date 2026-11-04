import { expect, test } from 'bun:test';
import {
  createProblemLoader,
  ProblemImportError,
} from '../../../backend/leetcode';
import { createHandler, type HttpEvent } from '../../../backend/service';
import type { FlashcardStore } from '../../../backend/model';
import { problemLink } from './problem-url';

const question = {
  title: 'Two Sum',
  titleSlug: 'two-sum',
  questionFrontendId: '1',
  difficulty: 'Easy',
  isPaidOnly: false,
  topicTags: [{ name: 'Array' }, { name: 'Hash Table' }],
  content:
    '<p>Given an array <code>nums</code>.</p><p>Constraints:</p><ul><li>length &lt;= 10<sup>4</sup></li></ul>',
};
function json(value: unknown = question) {
  return Response.json({ data: { question: value } });
}

test('normaliza links de problemas e rejeita outros destinos antes de acessar a rede', async () => {
  expect(
    problemLink(
      'https://www.leetcode.com/problems/two-sum/description/?envType=daily-question#foo',
    ),
  ).toEqual({ slug: 'two-sum', url: 'https://leetcode.com/problems/two-sum/' });
  for (const url of [
    'http://leetcode.com/problems/two-sum/',
    'https://leetcode.com.evil.test/problems/two-sum/',
    'https://user:password@leetcode.com/problems/two-sum/',
    'https://leetcode.com:8443/problems/two-sum/',
    'https://localhost/problems/two-sum/',
    'https://leetcode.com/problemset/',
    'https://leetcode.com/problems/a_b/',
    'invalid',
  ])
    expect(() => problemLink(url)).toThrow();
  let calls = 0;
  const load = createProblemLoader(async () => {
    calls++;
    return json();
  });
  await expect(load('../two-sum')).rejects.toMatchObject({ status: 400 });
  expect(calls).toBe(0);
});

test('consulta GraphQL público sem credenciais, normaliza metadados e usa cache limitado por tempo', async () => {
  const calls: Array<{ input: string; init?: RequestInit }> = [];
  let time = 0;
  const load = createProblemLoader(
    async (input, init) => {
      calls.push({ input: String(input), init });
      return json();
    },
    () => time,
  );
  const first = await load('two-sum');
  expect(first).toMatchObject({
    slug: 'two-sum',
    number: '1',
    difficulty: 'easy',
    tags: ['array', 'hash table'],
    content_html: question.content,
  });
  first.tags.push('local');
  expect((await load('two-sum')).tags).toEqual(['array', 'hash table']);
  expect(calls).toHaveLength(1);
  expect(calls[0].input).toBe('https://leetcode.com/graphql/');
  expect(calls[0].init?.redirect).toBe('error');
  expect(JSON.parse(calls[0].init!.body as string).variables).toEqual({
    titleSlug: 'two-sum',
  });
  expect(new Headers(calls[0].init?.headers).has('cookie')).toBe(false);
  time += 6 * 60 * 60_000;
  await load('two-sum');
  expect(calls).toHaveLength(2);
});

test('Premium, inexistente, bloqueio, limite de consultas e timeout têm mensagens recuperáveis', async () => {
  for (const [response, status] of [
    [json({ ...question, isPaidOnly: true }), 422],
    [json(null), 404],
    [new Response('Blocked', { status: 403 }), 502],
    [new Response('', { status: 429 }), 429],
    [json({ ...question, content: null }), 422],
    [Response.json({ errors: [{ message: 'Unknown query' }] }), 502],
  ] as const) {
    await expect(
      createProblemLoader(async () => response)('two-sum'),
    ).rejects.toMatchObject({ status });
  }
  await expect(
    createProblemLoader(async () => {
      throw new DOMException('Timeout', 'TimeoutError');
    })('two-sum'),
  ).rejects.toMatchObject({ status: 504 });
});

test('recusa payload enorme, estrutura inválida e resultados de outro problema', async () => {
  for (const response of [
    new Response('x'.repeat(1_000_001)),
    json({ ...question, difficulty: 'Unknown' }),
    json({ ...question, titleSlug: 'another-problem' }),
    json({ ...question, topicTags: [null] }),
    new Response('<html>Challenge</html>'),
  ])
    await expect(
      createProblemLoader(async () => response)('two-sum'),
    ).rejects.toMatchObject({ status: 502 });
});

test('rota de importação respeita origem e método, propaga erros e não acessa DynamoDB', async () => {
  let imports = 0;
  const unavailable = async () => {
    throw new Error('DynamoDB must not be accessed');
  };
  const store: FlashcardStore = {
    get: unavailable,
    put: unavailable,
    changes: unavailable,
  };
  const load = createProblemLoader(async () => {
    imports++;
    return json();
  });
  const handler = createHandler(
    store,
    ['https://site.example'],
    () => new Date(),
    load,
  );
  const event: HttpEvent = {
    requestContext: {
      http: { method: 'GET', path: '/leetcode/problems/two-sum' },
    },
    headers: { origin: 'https://site.example' },
  };
  const result = await handler(event);
  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body).number).toBe('1');
  expect(
    (await handler({ ...event, headers: { origin: 'https://wrong.example' } }))
      .statusCode,
  ).toBe(403);
  expect(
    (
      await handler({
        ...event,
        requestContext: {
          http: { method: 'POST', path: '/leetcode/problems/two-sum' },
        },
      })
    ).statusCode,
  ).toBe(405);
  expect(imports).toBe(1);
  const blocked = createHandler(
    store,
    [],
    () => new Date(),
    async () => {
      throw new ProblemImportError(429, 'Aguarde');
    },
  );
  expect((await blocked({ ...event, headers: {} })).statusCode).toBe(429);
});
