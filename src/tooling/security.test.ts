import { expect, test } from 'bun:test';
import { knownMalware, lockedDependencies } from '../../scripts/lib/security';

test('analisa aliases/transitivas do Bun e rejeita origens não verificáveis', () => {
  const packages = lockedDependencies(
    '{ "packages": { "alias": ["@scope/real@1.2.3"], "nested": ["@scope/real@1.2.3"], "other": ["other@2.0.0-beta.1"], }, }',
  );
  expect(packages).toEqual([
    { name: '@scope/real', version: '1.2.3' },
    { name: 'other', version: '2.0.0-beta.1' },
  ]);
  expect(() =>
    lockedDependencies('{"packages":{"git":["git+https://example.com/pkg"]}}'),
  ).toThrow();
  expect(() => lockedDependencies('{}')).toThrow();
});

test('consulta todas as páginas e encontra malware além da primeira página', async () => {
  let calls = 0;
  const findings = await knownMalware(
    [{ name: 'example', version: '1.0.0' }],
    async (_url, init) => {
      const query = JSON.parse(init.body as string).queries[0];
      calls++;
      if (calls === 1)
        return Response.json({
          results: [
            { vulns: [{ id: 'GHSA-example' }], next_page_token: 'page2' },
          ],
        });
      expect(query.page_token).toBe('page2');
      return Response.json({ results: [{ vulns: [{ id: 'MAL-2026-test' }] }] });
    },
  );
  expect(findings).toEqual([
    { name: 'example', version: '1.0.0', advisory: 'MAL-2026-test' },
  ]);
});

test('falha de rede/resposta incompleta não é tratada como resultado limpo', async () => {
  const packages = [{ name: 'example', version: '1.0.0' }];
  await expect(
    knownMalware(packages, async () => new Response('', { status: 503 })),
  ).rejects.toThrow();
  await expect(
    knownMalware(packages, async () => Response.json({ results: [] })),
  ).rejects.toThrow();
});

test('erro OSV mostra lote, página, endpoint e código de rede original', async () => {
  const packages = Array.from({ length: 101 }, (_, i) => ({
    name: `example-${i}`,
    version: '1.0.0',
  }));
  let calls = 0;
  const progress: string[] = [];
  await expect(
    knownMalware(
      packages,
      async () => {
        calls++;
        if (calls === 1)
          return Response.json({
            results: packages.slice(0, 100).map(() => ({})),
          });
        throw new Error('Falha no fetch', {
          cause: Object.assign(new Error('DNS não resolveu'), {
            code: 'ENOTFOUND',
          }),
        });
      },
      { onProgress: (message) => progress.push(message) },
    ),
  ).rejects.toThrow(
    /lote 2\/2, página 1, 1 pacote.*https:\/\/api.osv.dev\/v1\/querybatch.*ENOTFOUND.*DNS não resolveu/,
  );
  expect(progress).toHaveLength(2);
});

test('timeout OSV é explícito e nunca vira verificação aprovada', async () => {
  await expect(
    knownMalware(
      [{ name: 'example', version: '1.0.0' }],
      async (_url, { signal }) => {
        return new Promise<Response>((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(signal!.reason), {
            once: true,
          });
        });
      },
      { timeoutMs: 5 },
    ),
  ).rejects.toThrow(/tempo limite de 0.005 s excedido.*lote 1\/1, página 1/);
});

test('HTTP e JSON inválido preservam a causa e o contexto da consulta', async () => {
  const packages = [{ name: 'example', version: '1.0.0' }];
  await expect(
    knownMalware(packages, async () => new Response('', { status: 429 })),
  ).rejects.toThrow(/lote 1\/1.*HTTP 429/);
  await expect(
    knownMalware(packages, async () => new Response('invalid-json')),
  ).rejects.toThrow(/lote 1\/1.*SyntaxError/);
});
