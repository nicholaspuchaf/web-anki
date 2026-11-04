import { isBundledId } from '../../bundled-decks/ids';
import type { Card } from '../model';
import { difficultyLabels } from '../../leetcode/model';
import { TagList } from '../../leetcode/components/TagList';

type Props = {
  card: Card;
  now: number;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onPreview: () => void;
  onTag: (tag: string) => void;
};
export function ProblemListItem({
  card,
  now,
  busy,
  onEdit,
  onDelete,
  onFavorite,
  onPreview,
  onTag,
}: Props) {
  return (
    <article className="problem-list-item">
      <div>
        <div className="problem-list-meta">
          {card.multipleChoice && (
            <span className="eyebrow">MÚLTIPLA ESCOLHA · 4 ALTERNATIVAS</span>
          )}
          {card.leetcode && (
            <>
              <span className="eyebrow">
                LEETCODE {card.leetcode.number && `#${card.leetcode.number}`}
              </span>
              <span className={`difficulty ${card.leetcode.difficulty}`}>
                {difficultyLabels[card.leetcode.difficulty]}
              </span>
            </>
          )}
        </div>
        <h3>{card.front.split('\n')[0]}</h3>
        {!card.leetcode && !card.multipleChoice && !card.faces && (
          <p>{card.back}</p>
        )}
        {card.tags && <TagList tags={card.tags} onSelect={onTag} />}
        {card.leetcode && (
          <TagList tags={card.leetcode.tags} onSelect={onTag} />
        )}
        <small>
          {card.due <= now
            ? 'Pronto para revisar'
            : `Próxima revisão: ${new Date(card.due).toLocaleString('pt-BR')}`}{' '}
          · {card.reviews} revisões
        </small>
      </div>
      <div className="card-actions">
        <button
          aria-label={card.favorite ? 'Remover favorito' : 'Favoritar cartão'}
          aria-pressed={Boolean(card.favorite)}
          disabled={busy}
          onClick={onFavorite}
        >
          {card.favorite ? '★' : '☆'}
        </button>
        {(card.leetcode || card.multipleChoice || card.faces) && (
          <button disabled={busy} onClick={onPreview}>
            Visualizar cartão
          </button>
        )}
        <button
          disabled={busy || isBundledId(card.id)}
          title={
            isBundledId(card.id)
              ? 'Conteúdo mantido no repositório do site'
              : undefined
          }
          onClick={onEdit}
        >
          Editar
        </button>
        <button
          className="danger"
          disabled={busy || isBundledId(card.id)}
          title={
            isBundledId(card.id)
              ? 'Conteúdo mantido no repositório do site'
              : undefined
          }
          onClick={onDelete}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}
