import { readFeedDecks } from './feed-decks';
import { parseBackup } from '../../features/backup/parse-backup';
import { libraryDatabase as database } from './library-database';
import { persistHistory, publishHistory } from './review-history-repository';
import type { ReviewEvent } from '../../features/review-history/model';
import { emptyLibrary, type Library } from '../../features/library/model';
import { emptySyncState, type SyncState } from '../../features/sync/model';

export class LibraryConflictError extends Error {}

function parseLibrary(stored: unknown): Library {
  return stored
    ? parseBackup(JSON.stringify(stored))
    : structuredClone(emptyLibrary);
}
export async function readLibrary(): Promise<Library> {
  const db = await database();
  try {
    return parseLibrary(await db.get('library', 'current'));
  } finally {
    db.close();
  }
}
export async function writeLibrary(
  library: Library,
  expected?: Library,
  reviewEvent?: ReviewEvent,
): Promise<void> {
  const { referencedIds } = await readFeedDecks();
  const db = await database();
  try {
    const tx = db.transaction('library', 'readwrite');
    const current = parseLibrary(await tx.store.get('current'));
    if (
      expected &&
      JSON.stringify(parseLibrary(expected)) !== JSON.stringify(current)
    ) {
      tx.abort();
      await tx.done.catch(() => {});
      throw new LibraryConflictError(
        'Os dados mudaram em outra aba. Recarregue antes de salvar.',
      );
    }
    if (
      current.decks.some(
        (d) =>
          !library.decks.some((next) => next.id === d.id) &&
          referencedIds.has(d.id),
      )
    ) {
      tx.abort();
      await tx.done.catch(() => {});
      throw new Error(
        'Este baralho contém carrosséis. Mova ou exclua os carrosséis antes de excluir o baralho.',
      );
    }
    let history;
    try {
      history = await persistHistory(tx.store, current, library, reviewEvent);
    } catch (error) {
      tx.abort();
      await tx.done.catch(() => {});
      throw error;
    }
    await tx.store.put(library, 'current');
    const revision =
      ((await tx.store.get('revision')) as number | undefined) ?? 0;
    await tx.store.put(revision + 1, 'revision');
    await tx.done;
    publishHistory(history, reviewEvent);
  } finally {
    db.close();
  }
}
export type ClientSnapshot = {
  library: Library;
  state: SyncState;
  revision: number;
};
export function createSyncRepository(apiUrl: string) {
  const key = `sync:v1:${apiUrl.replace(/\/+$/, '')}`;
  return {
    async read(): Promise<ClientSnapshot> {
      const db = await database();
      try {
        const tx = db.transaction('library');
        const [stored, state, revision] = await Promise.all([
          tx.store.get('current'),
          tx.store.get(key),
          tx.store.get('revision'),
        ]);
        await tx.done;
        return {
          library: parseLibrary(stored),
          state: state ?? emptySyncState(),
          revision: revision ?? 0,
        };
      } finally {
        db.close();
      }
    },
    async commit(
      expectedRevision: number,
      library: Library,
      state: SyncState,
    ): Promise<boolean> {
      const db = await database();
      try {
        const tx = db.transaction('library', 'readwrite');
        const revision =
          ((await tx.store.get('revision')) as number | undefined) ?? 0;
        if (revision !== expectedRevision) {
          await tx.done;
          return false;
        }
        const current = parseLibrary(await tx.store.get('current'));
        let history;
        try {
          history = await persistHistory(tx.store, current, library);
        } catch (error) {
          tx.abort();
          await tx.done.catch(() => {});
          throw error;
        }
        await tx.store.put(library, 'current');
        await tx.store.put(state, key);
        await tx.store.put(revision + 1, 'revision');
        await tx.done;
        publishHistory(history);
        return true;
      } finally {
        db.close();
      }
    },
  };
}
export type SyncRepository = ReturnType<typeof createSyncRepository>;
