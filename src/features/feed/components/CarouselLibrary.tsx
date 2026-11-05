import type { Deck } from '../../decks/model';
import type { Card } from '../../library/model';
import type { Carousel, FeedData } from '../model';
import { carouselDeckId } from '../decks';
import { SelectField } from '../../../shared/ui/SelectField';

export function CarouselLibrary({
  data,
  decks,
  cards,
  selected,
  onSelect,
  onStudy,
  onEdit,
  onDelete,
  busy,
}: {
  data: FeedData;
  decks: Deck[];
  cards: Card[];
  selected: string;
  onSelect: (id: string) => void;
  onStudy: (carousel?: Carousel) => void;
  onEdit: (carousel: Carousel) => void;
  onDelete: (carousel: Carousel) => void;
  busy: boolean;
}) {
  const items = data.carousels.filter(
    (c) => !selected || carouselDeckId(c) === selected,
  );
  return (
    <div className="feed-manager">
      <div className="feed-deck-selection">
        <SelectField
          label="Baralho para estudar"
          value={selected}
          options={[
            { value: '', label: 'Todos os baralhos' },
            ...decks.map((d) => ({
              value: d.id,
              label: `${d.name} · ${data.carousels.filter((c) => carouselDeckId(c) === d.id).length} carrosséis · ${cards.filter((c) => c.deckId === d.id).length} ${cards.filter((c) => c.deckId === d.id).length === 1 ? 'flashcard' : 'flashcards'}`,
            })),
          ]}
          onChange={(e) => onSelect(e.target.value)}
        />
        <button
          className="primary"
          disabled={!items.length || busy}
          onClick={() => onStudy()}
        >
          Estudar baralho
        </button>
      </div>
      {!items.length && (
        <p className="feed-deck-empty">
          Este baralho ainda não tem carrosséis. Use “Novo carrossel” para
          adicionar o primeiro.
        </p>
      )}
      {items.map((carousel) => (
        <article key={carousel.id}>
          <div>
            <span className="eyebrow">
              {decks.find((d) => d.id === carouselDeckId(carousel))?.name} ·{' '}
              {carousel.slides.length} CARDS · A CADA {carousel.intervalDays}{' '}
              DIA(S)
            </span>
            <h2>{carousel.title}</h2>
            <p>{carousel.objective}</p>
          </div>
          <div className="feed-manager-actions">
            <button
              className="primary"
              onClick={() => onStudy(carousel)}
              disabled={busy}
            >
              Estudar carrossel
            </button>
            <button onClick={() => onEdit(carousel)} disabled={busy}>
              Editar
            </button>
            <button
              className="danger"
              onClick={() => onDelete(carousel)}
              disabled={busy}
            >
              Excluir
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
