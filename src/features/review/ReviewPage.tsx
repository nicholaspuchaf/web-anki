import { MultipleChoiceCard } from '../multiple-choice/components/MultipleChoiceCard';
import { getAvailableFaces } from '../leetcode/model';
import { LeetCodeCard } from '../leetcode/components/LeetCodeCard';
import type { Library } from '../library/model';
import { schedule } from './scheduler';
import type { ReviewSession } from './use-review';

type Props = {
  library: Library;
  review: ReviewSession;
  busy: boolean;
  now: number;
  onBack: () => void;
};
export function ReviewPage({ library, review, busy, now, onBack }: Props) {
  const {
    current,
    reviewed,
    remaining,
    revealed,
    reveal,
    rate,
    practice,
    choiceCorrect,
    answerChoice,
  } = review;
  const hasAnswer = current
    ? current.multipleChoice
      ? true
      : current.leetcode
        ? getAvailableFaces(current.leetcode).length > 0
        : Boolean(current.back.trim())
    : false;
  return (
    <section className="review">
      <button className="text-button back" onClick={onBack} disabled={busy}>
        ← Encerrar revisão
      </button>
      <p className="eyebrow">
        {practice
          ? 'TREINO LIVRE · SEM ALTERAR O AGENDAMENTO'
          : 'UM CARTÃO DE CADA VEZ'}
      </p>
      {current ? (
        <>
          <p>
            {reviewed} revisados · {remaining} restantes
          </p>
          {current.multipleChoice ? (
            <MultipleChoiceCard
              key={current.id}
              card={current}
              busy={busy}
              onAnswer={answerChoice}
            />
          ) : current.leetcode ? (
            <LeetCodeCard key={current.id} card={current} onReveal={reveal} />
          ) : (
            <div className="flashcard">
              <small>
                {library.decks.find((d) => d.id === current.deckId)?.name}
              </small>
              <h2>{current.front}</h2>
              {!hasAnswer ? (
                <p>
                  Nenhum verso preenchido. Avalie sua lembrança da pergunta.
                </p>
              ) : revealed ? (
                <div className="answer">{current.back}</div>
              ) : (
                <p>Pense na resposta antes de revelar.</p>
              )}
            </div>
          )}
          {practice ? (
            current.multipleChoice && !revealed ? (
              <p className="review-instruction">
                Selecione uma alternativa e confirme sua resposta.
              </p>
            ) : (
              <button
                className="primary reveal"
                disabled={busy}
                onClick={() => rate('good')}
              >
                Concluir treino deste cartão →
              </button>
            )
          ) : revealed || !hasAnswer ? (
            <div
              className={`ratings${current.multipleChoice && choiceCorrect === false ? ' ratings-retry' : ''}`}
            >
              {(
                [
                  ['again', 'De novo', '1 minuto'],
                  ['hard', 'Difícil', ''],
                  ['good', 'Bom', ''],
                  ['easy', 'Fácil', ''],
                ] as const
              )
                .filter(
                  ([rating]) =>
                    !current.multipleChoice ||
                    choiceCorrect !== false ||
                    rating === 'again',
                )
                .map(([rating, label, hint]) => {
                  const next = schedule(current, rating, now);
                  return (
                    <button
                      key={rating}
                      disabled={busy}
                      onClick={() => rate(rating)}
                    >
                      {label}
                      <small>
                        {hint ||
                          `${Math.round(next.interval * 10) / 10} dia(s)`}
                      </small>
                    </button>
                  );
                })}
            </div>
          ) : current.multipleChoice ? (
            <p className="review-instruction">
              Selecione uma alternativa e confirme sua resposta para continuar.
            </p>
          ) : !current.leetcode ? (
            <button className="primary reveal" onClick={() => reveal()}>
              Mostrar resposta
            </button>
          ) : (
            <p className="review-instruction">
              Explore os versos e depois avalie o que conseguiu lembrar.
            </p>
          )}
        </>
      ) : (
        <div className="empty">
          <span className="empty-icon">✓</span>
          <h1>Mais um passo dado.</h1>
          <p>
            {reviewed
              ? `Você revisou ${reviewed} cartão(ões).`
              : 'Nenhum cartão pendente agora.'}{' '}
            Os cartões marcados “De novo” voltam a ficar disponíveis em um
            minuto.
          </p>
          <button className="primary" onClick={onBack}>
            Voltar aos baralhos
          </button>
        </div>
      )}
    </section>
  );
}
