import { parseBackup } from '../../features/backup/parse-backup';
import { openDB } from 'idb';
import { emptyLibrary, type Library } from '../../features/library/model';

const database = () =>
  openDB('folha', 1, {
    upgrade(db) {
      db.createObjectStore('library');
    },
  });
export async function readLibrary(): Promise<Library> {
  const db = await database();
  try {
    const stored = await db.get('library', 'current');
    return stored
      ? parseBackup(JSON.stringify(stored))
      : structuredClone(emptyLibrary);
  } finally {
    db.close();
  }
}
export async function writeLibrary(library: Library): Promise<void> {
  const db = await database();
  try {
    await db.put('library', library, 'current');
  } finally {
    db.close();
  }
}
