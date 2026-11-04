import type { CardContent } from './model';
import { optionLetters } from '../multiple-choice/model';
import { CodeBlock } from '../leetcode/components/CodeBlock';
import { difficultyLabels, faceLabels } from '../leetcode/model';

export function ConflictPreview({ content }: { content: CardContent | null }) {
  if (!content) return <p>Cartão excluído.</p>;
  const { card, deck } = content;
  return (
    <div className="sync-conflict-preview">
      <p>
        Baralho: <strong>{deck.name}</strong>
      </p>
      <h4>Pergunta</h4>
      <p className="preserve-text">{card.front}</p>
      {card.back && (
        <>
          <h4>Resposta</h4>
          <p className="preserve-text">{card.back}</p>
        </>
      )}
      {card.multipleChoice && (
        <>
          <h4>Alternativas</h4>
          <ul>
            {card.multipleChoice.options.map((option, index) => (
              <li key={index} className="preserve-text">
                {optionLetters[index]}. {option}
                {index === card.multipleChoice!.correctIndex
                  ? ' · Correta'
                  : ''}
              </li>
            ))}
          </ul>
          {card.multipleChoice.explanation && (
            <p className="preserve-text">{card.multipleChoice.explanation}</p>
          )}
        </>
      )}
      {card.leetcode && (
        <>
          <p>Dificuldade: {difficultyLabels[card.leetcode.difficulty]}</p>
          {card.leetcode.tags.length > 0 && (
            <p>Tags: {card.leetcode.tags.join(', ')}</p>
          )}
          {card.leetcode.url && (
            <p>
              <a href={card.leetcode.url} target="_blank" rel="noreferrer">
                Abrir problema ↗
              </a>
            </p>
          )}
          {card.leetcode.constraints && (
            <>
              <h4>Restrições e casos de borda</h4>
              <p className="preserve-text">{card.leetcode.constraints}</p>
            </>
          )}
          {card.leetcode.faces.map((face) => (
            <section key={face.id}>
              <h4>{face.title.trim() || faceLabels[face.kind]}</h4>
              {face.kind === 'solution' ? (
                <CodeBlock code={face.content} language={face.language} />
              ) : (
                <p className="preserve-text">
                  {face.content || 'Sem conteúdo.'}
                </p>
              )}
            </section>
          ))}
        </>
      )}
      <p>
        {card.favorite ? '★ Favorito' : 'Não está nos favoritos'} ·{' '}
        {card.reviews} revisões
      </p>
      <p>Próxima revisão: {new Date(card.due).toLocaleString('pt-BR')}</p>
    </div>
  );
}
