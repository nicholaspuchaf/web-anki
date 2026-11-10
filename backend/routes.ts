import type { FlashcardStore } from './model';
import type { ReworkStore } from './rework';
import type { loadProblem } from './leetcode';
import { reply, type HttpRequest, type HttpResponse } from './http';
import { handleFlashcards } from './endpoints/flashcards';
import { handleSync } from './endpoints/sync';
import { handleLeetCode } from './endpoints/leetcode';
import { handleListRework } from './endpoints/list-rework';
import { handleMarkRework } from './endpoints/mark-rework';

type Route = {
  path: string | RegExp;
  methods?: readonly string[];
  handle: (
    request: HttpRequest,
    match: readonly string[],
  ) => Promise<HttpResponse> | HttpResponse;
};
type Dependencies = {
  store: FlashcardStore;
  now: () => Date;
  importProblem: typeof loadProblem;
  reworkStore?: ReworkStore;
};

export function createRoutes({
  store,
  now,
  importProblem,
  reworkStore,
}: Dependencies): Route[] {
  return [
    {
      path: '/library',
      handle: () =>
        reply(410, {
          error:
            'O protocolo de biblioteca inteira foi substituído por /sync e /flashcards/:id. Atualize o cliente.',
        }),
    },
    {
      path: /^\/leetcode\/problems\/([^/]+)$/,
      methods: ['GET'],
      handle: (_request, [, slug]) => handleLeetCode(slug, importProblem),
    },
    {
      path: '/sync',
      methods: ['GET'],
      handle: (request) => handleSync(request, store, now),
    },
    {
      path: /^\/flashcards\/([^/]+)$/,
      methods: ['GET', 'PUT', 'DELETE'],
      handle: (request, [, id]) => handleFlashcards(request, id, store, now),
    },
    {
      path: /^\/flashcards\/([^/]+)\/rework$/,
      methods: ['PUT'],
      handle: (request, [, id]) =>
        handleMarkRework(request, id, reworkStore, now),
    },
    {
      path: '/rework-requests',
      methods: ['GET'],
      handle: (request) => handleListRework(request, reworkStore),
    },
  ];
}
