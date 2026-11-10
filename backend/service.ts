import type { FlashcardStore } from './model';
import type { ReworkStore } from './rework';
import { loadProblem } from './leetcode';
import {
  readRequest,
  reply,
  requestFailure,
  type HttpEvent,
  type HttpResponse,
} from './http';
import { createRoutes } from './routes';

// Preserve the existing entry point for Lambda, clients and integration tests.
export type { HttpEvent, HttpResponse } from './http';
export function createHandler(
  store: FlashcardStore,
  origins: string[],
  now: () => Date = () => new Date(),
  importProblem = loadProblem,
  reworkStore?: ReworkStore,
) {
  const routes = createRoutes({ store, now, importProblem, reworkStore });
  return async (event: HttpEvent): Promise<HttpResponse> => {
    const request = readRequest(event);
    if (request.headers.origin && !origins.includes(request.headers.origin))
      return reply(403, { error: 'Origem não permitida.' });
    if (request.method === 'OPTIONS') return reply(204, null);
    for (const route of routes) {
      const match =
        typeof route.path === 'string'
          ? route.path === request.path
            ? []
            : null
          : route.path.exec(request.path);
      if (!match) continue;
      if (route.methods && !route.methods.includes(request.method))
        return reply(405, { error: 'Método não permitido.' });
      try {
        return await route.handle(request, match);
      } catch (error) {
        return requestFailure(error);
      }
    }
    return reply(404, { error: 'Rota não encontrada.' });
  };
}
