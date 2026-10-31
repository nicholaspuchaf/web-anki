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
