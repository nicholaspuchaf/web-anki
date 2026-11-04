import { useState } from 'react';
import { getDeckCards, getDueCards } from '../selectors';
import { removeDeck, removeCard, putCard } from '../commands';
import type { Card, Deck, Library } from '../model';
import type { SaveLibrary } from '../hooks/use-library';
import { emptyFilters, filterCards } from '../filter-cards';
import { CardFilters } from './CardFilters';
import { ProblemListItem } from './ProblemListItem';
import { Modal } from '../../../shared/ui/Modal';
import { CardPreview } from './CardPreview';

type Props = {
  library: Library;
  deck: Deck;
  now: number;
  busy: boolean;
  save: SaveLibrary;
  begin: (id: string, options?: { ids?: string[]; practice?: boolean }) => void;
  onBack: () => void;
  onEdit: (card: Card | null) => void;
};
export function DeckPage({
  library,
  deck,
  now,
  busy,
  save,
  begin,
  onBack,
  onEdit,
}: Props) {
  const [filters, setFilters] = useState(emptyFilters);
  const [preview, setPreview] = useState<Card | null>(null);
  const cards = getDeckCards(library, deck.id);
  const filtered = filterCards(cards, filters);
  const due = getDueCards(filtered, now);
  const tags = [
    ...new Set(cards.flatMap((c) => c.leetcode?.tags ?? [])),
  ].sort();
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        ← Todos os baralhos
      </button>
      <div className="section-title">
        <div>
          <p className="eyebrow">SEU BARALHO</p>
          <h1>{deck.name}</h1>
          <p>
            {cards.length} cartões · {getDueCards(cards, now).length} para
            revisar
          </p>
        </div>
        <button className="primary" onClick={() => onEdit(null)}>
          + Novo cartão
        </button>
      </div>
      <CardFilters value={filters} onChange={setFilters} tags={tags} />
      <div className="toolbar">
        <button
          className="primary"
          disabled={busy || !due.length}
          onClick={() => begin(deck.id, { ids: filtered.map((c) => c.id) })}
        >
          Revisar este baralho ↗
        </button>
        <button
          disabled={busy || !filtered.length}
          onClick={() =>
            begin(deck.id, { ids: filtered.map((c) => c.id), practice: true })
          }
        >
          Treino livre · {filtered.length} cartões
        </button>
        <button
          className="danger"
          disabled={busy}
          onClick={async () => {
            if (
              window.confirm(
                `Excluir “${deck.name}” e todos os seus cartões?`,
              ) &&
              (await save(removeDeck(library, deck.id)))
            )
              onBack();
          }}
        >
          Excluir baralho
        </button>
      </div>
      <p className="filter-summary">
        {filtered.length} de {cards.length} cartões · {due.length} pendentes
        nesta seleção. O treino livre não altera as datas de revisão.
      </p>
      {!filtered.length && (
        <div className="empty">
          <h3>
            {cards.length
              ? 'Nenhum problema com esses filtros'
              : 'Qual problema você já resolveu?'}
          </h3>
          <p>
            {cards.length
              ? 'Ajuste a busca ou limpe os filtros.'
              : 'Guarde o raciocínio, as dicas e o código para lembrar depois.'}
          </p>
        </div>
      )}
      <div className="card-list">
        {filtered.map((card) => (
          <ProblemListItem
            key={card.id}
            card={card}
            now={now}
            busy={busy}
            onEdit={() => onEdit(card)}
            onPreview={() => setPreview(card)}
            onFavorite={() =>
              void save(putCard(library, { ...card, favorite: !card.favorite }))
            }
            onTag={(tag) => setFilters({ ...filters, tag })}
            onDelete={async () => {
              if (window.confirm('Excluir este cartão?'))
                await save(removeCard(library, card.id));
            }}
          />
        ))}
      </div>
      {preview && (
        <Modal title="Prévia do cartão" wide onClose={() => setPreview(null)}>
          <CardPreview key={preview.id} card={preview} />
        </Modal>
      )}
    </>
  );
}
