import { useState } from 'react';
import type { Card } from '../library/model';
import { filledFaces } from './model';
import { TagList } from '../leetcode/components/TagList';

export function StandardCard({
  card,
  onReveal,
}: {
  card: Card;
  onReveal?: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const faces = filledFaces(card.faces ?? []);
  const face = faces.find((item) => item.id === active);
  return (
    <article className="standard-card">
      <p className="eyebrow">PERGUNTA E VERSOS</p>
      <h2 className="preserve-text">{card.front}</h2>
      <TagList tags={card.tags ?? []} />
      <nav className="standard-face-options" aria-label="Versos do cartão">
        {faces.map((item, index) => (
          <button
            key={item.id}
            aria-pressed={active === item.id}
            onClick={() => {
              setActive(item.id);
              onReveal?.();
            }}
          >
            <span>{index + 1}</span> {item.title}
          </button>
        ))}
      </nav>
      {face ? (
        <section aria-label="Verso selecionado" className="standard-face">
          <h3>{face.title}</h3>
          <p className="preserve-text">{face.content}</p>
        </section>
      ) : (
        <p className="review-instruction">
          {faces.length
            ? 'Tente lembrar antes de escolher um verso.'
            : 'Nenhum verso preenchido.'}
        </p>
      )}
      {card.sourceUrl && (
        <a
          className="standard-source"
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Consultar fonte oficial ↗
        </a>
      )}
    </article>
  );
}
