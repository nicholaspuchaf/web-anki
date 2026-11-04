import {
  readLibrary,
  writeLibrary,
  LibraryConflictError,
} from '../../shared/storage/library-repository';
import { withBundledAwsDeck } from './aws';

export async function bootstrapLibrary() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readLibrary();
    const next = withBundledAwsDeck(current);
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
