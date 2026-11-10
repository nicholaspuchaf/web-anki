import { loadProblem, ProblemImportError } from '../leetcode';
import { reply, type HttpResponse } from '../http';

export async function handleLeetCode(
  slug: string,
  importProblem: typeof loadProblem,
): Promise<HttpResponse> {
  try {
    return reply(200, await importProblem(slug));
  } catch (cause) {
    if (cause instanceof ProblemImportError)
      return reply(cause.status, { error: cause.message });
    return reply(502, {
      error: 'Não foi possível consultar o LeetCode agora.',
    });
  }
}
