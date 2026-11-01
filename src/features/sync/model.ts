import type { Card, Deck, Library } from '../library/model';

export type CardContent = { card: Card; deck: Deck };
export type CloudCard = {
  flashcard_id: string;
  last_updated_at: string;
  version: number;
} & (({ deleted_at: null } & CardContent) | { deleted_at: string });
export type SyncState = {
  version: 1;
  last_sync_at: string | null;
  last_reconciled_at: string | null;
  records: Record<string, CloudCard>;
  conflicts: Record<string, CloudCard>;
};
export function emptySyncState(): SyncState {
  return {
    version: 1,
    last_sync_at: null,
    last_reconciled_at: null,
    records: {},
    conflicts: {},
  };
}
export function localContent(library: Library, id: string): CardContent | null {
  const card = library.cards.find((card) => card.id === id);
  if (!card) return null;
  const deck = library.decks.find((deck) => deck.id === card.deckId);
  if (!deck) throw new Error('Cartão sem baralho.');
  return { card, deck };
}
export function remoteContent(record?: CloudCard): CardContent | null {
  return record?.deleted_at === null
    ? { card: record.card, deck: record.deck }
    : null;
}
export function sameContent(
  a: CardContent | null,
  b: CardContent | null,
): boolean {
  const stable = (value: unknown) =>
    JSON.stringify(value, (_key, item) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(
            Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
          )
        : item,
    );
  return stable(a) === stable(b);
}
export function recordAt(
  records: Record<string, CloudCard>,
  id: string,
): CloudCard | undefined {
  return Object.hasOwn(records, id) ? records[id] : undefined;
}
export function pendingIds(library: Library, state: SyncState): string[] {
  const ids = new Set([
    ...library.cards.map((card) => card.id),
    ...Object.keys(state.records),
  ]);
  return [...ids].filter(
    (id) =>
      !recordAt(state.conflicts, id) &&
      !sameContent(
        localContent(library, id),
        remoteContent(recordAt(state.records, id)),
      ),
  );
}
export function applyRemote(library: Library, record: CloudCard): Library {
  const cards = library.cards.filter((card) => card.id !== record.flashcard_id);
  if (record.deleted_at !== null) return { ...library, cards };
  const decks = [...library.decks];
  const index = decks.findIndex((deck) => deck.id === record.deck.id);
  if (index < 0) decks.push(record.deck);
  else decks[index] = record.deck;
  return { ...library, decks, cards: [...cards, record.card] };
}
export function mergeChanges(
  library: Library,
  state: SyncState,
  changes: CloudCard[],
) {
  let next = library;
  const records: Record<string, CloudCard> = Object.assign(
    Object.create(null),
    state.records,
  );
  const conflicts: Record<string, CloudCard> = Object.assign(
    Object.create(null),
    state.conflicts,
  );
  const dirtyDecks = new Set(
    library.decks
      .filter((deck) => {
        const known = Object.values(state.records).filter(
          (record) => record.deleted_at === null && record.deck.id === deck.id,
        );
        return (
          !known.length ||
          known.some(
            (record) =>
              record.deleted_at === null && record.deck.name !== deck.name,
          )
        );
      })
      .map((deck) => deck.id),
  );
  const latest = new Map<string, CloudCard>();
  for (const record of changes)
    if (record.version > (latest.get(record.flashcard_id)?.version ?? 0))
      latest.set(record.flashcard_id, record);
  for (const incoming of latest.values()) {
    const id = incoming.flashcard_id;
    const previous = records[id];
    if (
      incoming.version <=
      Math.max(previous?.version ?? 0, conflicts[id]?.version ?? 0)
    )
      continue;
    const local = localContent(library, id);
    const base = remoteContent(previous);
    const remote = remoteContent(incoming);
    if (previous && !sameContent(local, base) && sameContent(remote, base)) {
      records[id] = incoming;
      delete conflicts[id];
      continue;
    }
    if (!sameContent(local, base) && !sameContent(local, remote)) {
      conflicts[id] = incoming;
      continue;
    }
    const localDeck =
      incoming.deleted_at === null && dirtyDecks.has(incoming.deck.id)
        ? library.decks.find((deck) => deck.id === incoming.deck.id)
        : undefined;
    next = applyRemote(
      next,
      localDeck && incoming.deleted_at === null
        ? { ...incoming, deck: localDeck }
        : incoming,
    );
    records[id] = incoming;
    delete conflicts[id];
  }
  return { library: next, state: { ...state, records, conflicts } };
}
export function resolveConflict(
  library: Library,
  state: SyncState,
  id: string,
  choice: 'local' | 'remote',
) {
  const incoming = recordAt(state.conflicts, id);
  if (!incoming) return { library, state };
  const conflicts = { ...state.conflicts };
  delete conflicts[id];
  return {
    library: choice === 'remote' ? applyRemote(library, incoming) : library,
    state: {
      ...state,
      records: { ...state.records, [id]: incoming },
      conflicts,
    },
  };
}
