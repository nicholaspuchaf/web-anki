import { libraryDatabase } from './library-database';
import { emptyLibrary, type Library } from '../../features/library/model';
import { parseBackup } from '../../features/backup/parse-backup';
import {
  historyAfterSave,
  type HistoryMeta,
  type ReviewEvent,
  type ReviewHistory,
} from '../../features/review-history/model';

export const HISTORY_META_KEY = 'review-history:meta:v1';
export const HISTORY_EVENT_PREFIX = 'review-history:event:';
export const HISTORY_LOCAL_PREFIX = 'folha:review-history:v1:';
export const HISTORY_CHANGED = 'folha-review-history-change';
type HistoryStore = {
  get: (key: IDBValidKey) => Promise<unknown>;
  put: (value: unknown, key: IDBValidKey) => Promise<IDBValidKey>;
  add: (value: unknown, key: IDBValidKey) => Promise<IDBValidKey>;
};
export async function persistHistory(
  store: HistoryStore,
  current: Library,
  next: Library,
  event?: ReviewEvent,
): Promise<HistoryMeta> {
  const old = (await store.get(HISTORY_META_KEY)) as HistoryMeta | undefined;
  const meta = historyAfterSave(old, current, next, event);
  if (event) {
    const key = HISTORY_EVENT_PREFIX + event.id;
    if (await store.get(key))
      throw new Error('Esta revisão já foi registrada.');
    await store.add(event, key);
  }
  if (JSON.stringify(old) !== JSON.stringify(meta))
    await store.put(meta, HISTORY_META_KEY);
  return meta;
}
/** IndexedDB is committed first: a failed cache write must never undo saved progress. */
export function mirrorHistory(
  meta: HistoryMeta,
  events: ReviewEvent[],
  storage?: Pick<Storage, 'setItem'>,
): string | undefined {
  if (!storage && typeof window === 'undefined') return;
  try {
    const target = storage ?? window.localStorage;
    target.setItem(HISTORY_LOCAL_PREFIX + 'meta', JSON.stringify(meta));
    for (const event of events)
      target.setItem(
        HISTORY_LOCAL_PREFIX + 'event:' + event.id,
        JSON.stringify(event),
      );
  } catch {
    return 'Não foi possível atualizar a cópia do histórico no localStorage. As revisões continuam preservadas neste aparelho.';
  }
}
export function publishHistory(meta: HistoryMeta, event?: ReviewEvent) {
  const warning = mirrorHistory(meta, event ? [event] : []);
  if (typeof window !== 'undefined')
    window.dispatchEvent(
      new CustomEvent(HISTORY_CHANGED, { detail: { warning } }),
    );
}
export async function readReviewHistory(): Promise<
  ReviewHistory & { library: Library }
> {
  const db = await libraryDatabase();
  try {
    const tx = db.transaction('library', 'readwrite');
    try {
      const stored = await tx.store.get('current');
      const library = stored
        ? parseBackup(JSON.stringify(stored))
        : emptyLibrary;
      const meta = await persistHistory(tx.store, library, library);
      const events = (await tx.store.getAll(
        IDBKeyRange.bound(
          HISTORY_EVENT_PREFIX,
          HISTORY_EVENT_PREFIX + '\uffff',
        ),
      )) as ReviewEvent[];
      await tx.done;
      return { meta, events, library, warning: mirrorHistory(meta, events) };
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Already completed. */
      }
      await tx.done.catch(() => {});
      throw error;
    }
  } finally {
    db.close();
  }
}
