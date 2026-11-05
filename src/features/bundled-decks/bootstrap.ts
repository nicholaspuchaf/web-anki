import { readFeedDecks } from '../../shared/storage/feed-decks';
import {
  readLibrary,
  writeLibrary,
  LibraryConflictError,
} from '../../shared/storage/library-repository';
import { withBundledDecks } from './catalog';

export async function bootstrapLibrary() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readLibrary();
    const shared = await readFeedDecks();
    const ids = new Set(current.decks.map((d) => d.id));
    const next = withBundledDecks({
      ...current,
      decks: [...current.decks, ...shared.decks.filter((d) => !ids.has(d.id))],
    });
    if (JSON.stringify(current) === JSON.stringify(next)) return current;
    try {
      await writeLibrary(next, current);
      return next;
    } catch (error) {
      if (!(error instanceof LibraryConflictError)) throw error;
    }
  }
  throw new Error(
    'Os dados mudaram em outra aba. Recarregue para abrir a biblioteca.',
  );
}
