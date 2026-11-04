import {
  parseImportedProblem,
  type ImportedProblem,
} from '../src/features/leetcode/problem-url';

export class ProblemImportError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const QUERY = `query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId title titleSlug content difficulty isPaidOnly topicTags { name }
  }
}`;
const MAX_RESPONSE_BYTES = 1_000_000;
const CACHE_TTL_MS = 6 * 60 * 60_000;
export function createProblemLoader(
  request: (input: string, init?: RequestInit) => Promise<Response> = fetch,
  now = () => Date.now(),
) {
  const cache = new Map<
    string,
    { expires: number; problem: ImportedProblem }
  >();
  return async (slug: string): Promise<ImportedProblem> => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 150)
      throw new ProblemImportError(400, 'Identificador de problema inválido.');
    const cached = cache.get(slug);
    if (cached && cached.expires > now())
      return structuredClone(cached.problem);
    try {
      const response = await request('https://leetcode.com/graphql/', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(8_000),
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          referer: `https://leetcode.com/problems/${slug}/`,
          'user-agent': 'iphone-study/0.1',
        },
        body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
      });
      if (response.status === 429)
        throw new ProblemImportError(
          429,
          'O LeetCode limitou as consultas. Aguarde e tente novamente.',
        );
      if (!response.ok)
        throw new ProblemImportError(
          502,
          'O LeetCode recusou a consulta. Você pode preencher o cartão manualmente.',
        );
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Empty response');
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_RESPONSE_BYTES) throw new Error('Response too large');
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (data.errors?.length) throw new Error('GraphQL errors');
      const question = data.data?.question;
      if (question === null)
        throw new ProblemImportError(
          404,
          'Problema não encontrado no LeetCode.',
        );
      if (!question || typeof question !== 'object')
        throw new Error('Invalid question');
      if (question.isPaidOnly === true)
        throw new ProblemImportError(
          422,
          'Este problema exige LeetCode Premium. Cole o enunciado manualmente se você tiver acesso.',
        );
      if (!question.content)
        throw new ProblemImportError(
          422,
          'O LeetCode não disponibilizou o enunciado. Preencha-o manualmente.',
        );
      const problem = parseImportedProblem(
        {
          slug: question.titleSlug,
          url: `https://leetcode.com/problems/${question.titleSlug}/`,
          title: question.title,
          number: question.questionFrontendId,
          difficulty:
            typeof question.difficulty === 'string'
              ? question.difficulty.toLowerCase()
              : null,
          tags: Array.isArray(question.topicTags)
            ? question.topicTags.map(
                (tag: { name?: unknown } | null) => tag?.name,
              )
            : null,
          content_html: question.content,
        },
        slug,
      );
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(slug, { expires: now() + CACHE_TTL_MS, problem });
      return structuredClone(problem);
    } catch (cause) {
      if (cause instanceof ProblemImportError) throw cause;
      if (
        cause instanceof Error &&
        ['TimeoutError', 'AbortError'].includes(cause.name)
      )
        throw new ProblemImportError(
          504,
          'O LeetCode demorou para responder. Tente novamente ou preencha manualmente.',
        );
      throw new ProblemImportError(
        502,
        'Não foi possível importar o problema do LeetCode agora. Seus dados não foram alterados.',
      );
    }
  };
}
export const loadProblem = createProblemLoader();
