import type { Library } from '../library/model';
import type {
  SyncRepository,
  ClientSnapshot,
} from '../../shared/storage/library-repository';
import { CloudError, type CloudApi } from './api';
import {
  localContent,
  mergeChanges,
  pendingIds,
  recordAt,
  resolveConflict,
  type CloudCard,
  type SyncState,
} from './model';

const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000;
export function createSyncEngine(
  api: CloudApi,
  repository: SyncRepository,
  now = () => Date.now(),
) {
  async function update(
    transform: (snapshot: ClientSnapshot) => {
      library: Library;
      state: SyncState;
    },
  ) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const snapshot = await repository.read();
      const next = transform(snapshot);
      if (await repository.commit(snapshot.revision, next.library, next.state))
        return;
    }
    throw new Error(
      'Os dados mudaram em outra aba. Tente sincronizar novamente.',
    );
  }
  async function pull(forceFull: boolean) {
    const initial = await repository.read();
    const full =
      forceFull ||
      !initial.state.last_reconciled_at ||
      now() - Date.parse(initial.state.last_reconciled_at) >=
        RECONCILE_INTERVAL_MS;
    const changes: CloudCard[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    let checkpoint: string | null = null;
    do {
      const page = await api.changes(
        cursor
          ? { cursor }
          : !full && initial.state.last_sync_at
            ? { since: initial.state.last_sync_at }
            : {},
      );
      changes.push(...page.changes);
      checkpoint = page.last_sync_at;
      cursor = page.next_cursor ?? undefined;
      if (cursor) {
        if (seen.has(cursor))
          throw new Error('A nuvem repetiu uma página de sincronização.');
        seen.add(cursor);
      }
    } while (cursor);
    if (!checkpoint)
      throw new Error('A nuvem não confirmou o fim da sincronização.');
    await update(({ library, state }) => {
      const merged = mergeChanges(library, state, changes);
      return {
        library: merged.library,
        state: {
          ...merged.state,
          last_sync_at:
            state.last_sync_at && state.last_sync_at > checkpoint
              ? state.last_sync_at
              : checkpoint,
          last_reconciled_at:
            full &&
            (!state.last_reconciled_at || state.last_reconciled_at < checkpoint)
              ? checkpoint
              : state.last_reconciled_at,
        },
      };
    });
  }
  return {
    async sync(forceFull = false) {
      await pull(forceFull);
      const initial = await repository.read();
      const ids = pendingIds(initial.library, initial.state);
      let sent = 0;
      for (const id of ids) {
        const snapshot = await repository.read();
        if (!pendingIds(snapshot.library, snapshot.state).includes(id))
          continue;
        const content = localContent(snapshot.library, id);
        const version = recordAt(snapshot.state.records, id)?.version ?? 0;
        try {
          const accepted = content
            ? await api.put(id, content, version)
            : await api.delete(id, version);
          await update(({ library, state }) => {
            if ((recordAt(state.records, id)?.version ?? 0) >= accepted.version)
              return { library, state };
            // Keep edits made while the request was in flight; the next sync sends them.
            const records = { ...state.records, [id]: accepted };
            const conflicts = { ...state.conflicts };
            if ((recordAt(conflicts, id)?.version ?? 0) <= accepted.version)
              delete conflicts[id];
            return { library, state: { ...state, records, conflicts } };
          });
          sent++;
        } catch (error) {
          if (!(error instanceof CloudError) || error.status !== 409)
            throw error;
          const remote = await api.get(id);
          await update(({ library, state }) =>
            mergeChanges(library, state, [remote]),
          );
        }
      }
      return { sent, snapshot: await repository.read() };
    },
    async resolve(id: string, choice: 'local' | 'remote') {
      await update(({ library, state }) =>
        resolveConflict(library, state, id, choice),
      );
      return repository.read();
    },
  };
}
