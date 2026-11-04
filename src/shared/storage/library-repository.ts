import { parseBackup } from '../../features/backup/parse-backup';
import { openDB } from 'idb';
import { emptyLibrary, type Library } from '../../features/library/model';
import { emptySyncState, type SyncState } from '../../features/sync/model';

export class LibraryConflictError extends Error {}

const database = () =>
  openDB('folha', 1, {
    upgrade(db) {
      db.createObjectStore('library');
    },
  });
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
): Promise<void> {
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
    await tx.store.put(library, 'current');
    const revision =
      ((await tx.store.get('revision')) as number | undefined) ?? 0;
    await tx.store.put(revision + 1, 'revision');
    await tx.done;
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
        await tx.store.put(library, 'current');
        await tx.store.put(state, key);
        await tx.store.put(revision + 1, 'revision');
        await tx.done;
        return true;
      } finally {
        db.close();
      }
    },
  };
}
export type SyncRepository = ReturnType<typeof createSyncRepository>;
