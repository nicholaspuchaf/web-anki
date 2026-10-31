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
        {!card.leetcode && <p>{card.back}</p>}
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
        {card.leetcode && (
          <button onClick={onPreview}>Visualizar cartão</button>
        )}
        <button disabled={busy} onClick={onEdit}>
          Editar
        </button>
        <button className="danger" disabled={busy} onClick={onDelete}>
          Excluir
        </button>
      </div>
    </article>
  );
}
