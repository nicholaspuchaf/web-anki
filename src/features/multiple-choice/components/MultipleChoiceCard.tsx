import { useId, useState } from 'react';
import type { Card } from '../../library/model';
import { optionLetters } from '../model';

export function MultipleChoiceCard({
  card,
  busy = false,
  onAnswer,
}: {
  card: Card;
  busy?: boolean;
  onAnswer?: (correct: boolean) => void;
}) {
  const data = card.multipleChoice!;
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const correct = selected === data.correctIndex;
  return (
    <article
      className="multiple-choice-card"
      aria-label="Cartão de múltipla escolha"
    >
      <p className="eyebrow">MÚLTIPLA ESCOLHA · UMA RESPOSTA CORRETA</p>
      <h2 className="preserve-text">{card.front}</h2>
      <fieldset className="choice-options" disabled={busy || confirmed}>
        <legend>Selecione uma alternativa</legend>
        {optionLetters.map((letter, index) => {
          const isCorrect = confirmed && index === data.correctIndex;
          const isWrong = confirmed && selected === index && !correct;
          return (
            <label
              key={letter}
              className={`choice-option${selected === index ? ' selected' : ''}${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`}
            >
              <input
                type="radio"
                name={`${id}-answer`}
                value={index}
                checked={selected === index}
                onChange={() => setSelected(index)}
              />
              <span className="choice-letter" aria-hidden="true">
                {letter}
              </span>
              <span className="choice-option-text preserve-text">
                {data.options[index]}
              </span>
              {isCorrect && <span className="choice-mark">✓ Correta</span>}
              {isWrong && <span className="choice-mark">✕ Sua resposta</span>}
            </label>
          );
        })}
      </fieldset>
      {!confirmed ? (
        <button
          className="primary"
          disabled={busy || selected === null}
          onClick={() => {
            if (selected === null) return;
            setConfirmed(true);
            onAnswer?.(correct);
          }}
        >
          Confirmar resposta
        </button>
      ) : (
        <div
          className={`choice-result ${correct ? 'correct' : 'incorrect'}`}
          role="status"
        >
          <strong>
            {correct
              ? 'Resposta correta!'
              : `Não foi desta vez. A resposta correta é ${optionLetters[data.correctIndex]}.`}
          </strong>
          {data.explanation && (
            <p className="preserve-text">{data.explanation}</p>
          )}
        </div>
      )}
    </article>
  );
}
