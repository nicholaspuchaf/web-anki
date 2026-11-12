import type { Library } from '../library/model';
import { schedule } from '../review/scheduler';
import { activeLibrary } from './model';
import { studyMilestones } from './study-plan';
import { useStudyPreferences } from './use-study-preferences';

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
export function StudyPlan({
  library,
  now,
  disabledDecks,
  onError,
}: {
  library: Library;
  now: number;
  disabledDecks: readonly string[];
  onError: (message: string) => void;
}) {
  const { preferences, updatePreferences } = useStudyPreferences();
  const cards = activeLibrary(library, disabledDecks).cards;
  const milestones = studyMilestones(cards, preferences.dailyGoal);
  const maxDays = Math.max(1, milestones[2].days);
  const due = cards.filter((card) => card.due <= now).length;
  const seed = {
    id: 'preview',
    deckId: '',
    front: '',
    back: '',
    interval: 0,
    due: 0,
    reviews: 0,
  };
  const first = schedule(seed, 'good', 0, preferences.spacingMultiplier);
  const second = schedule(
    first,
    'good',
    first.due,
    preferences.spacingMultiplier,
  );
  const third = schedule(
    second,
    'good',
    second.due,
    preferences.spacingMultiplier,
  );
  function update(patch: Partial<typeof preferences>) {
    try {
      updatePreferences(patch);
      onError('');
    } catch {
      onError(
        'Não foi possível salvar seu plano. A configuração anterior foi mantida. Verifique o armazenamento deste aparelho.',
      );
    }
  }
  return (
    <section className="study-plan" aria-labelledby="study-plan-title">
      <div className="study-plan-intro">
        <span className="eyebrow">UM POUCO TODOS OS DIAS</span>
        <h2 id="study-plan-title">Um ritmo que cabe na sua rotina</h2>
        <p>
          Não precisa revisar tudo hoje. Escolha uma meta pequena e acompanhe
          até onde ela pode levar você.
        </p>
      </div>
      <div className="study-plan-controls">
        <div className="study-plan-control">
          <label htmlFor="daily-goal">Meta diária</label>
          <div className="study-plan-value">
            <strong>{preferences.dailyGoal}</strong>
            <span>flashcards / dia</span>
          </div>
          <input
            id="daily-goal"
            type="range"
            min="1"
            max="200"
            step="1"
            value={preferences.dailyGoal}
            aria-describedby="daily-goal-help"
            onChange={(e) => update({ dailyGoal: Number(e.target.value) })}
          />
          <div className="study-plan-scale">
            <span>1 por dia</span>
            <span>200 por dia</span>
          </div>
          <p id="daily-goal-help">
            Uma meta para orientar seu ritmo. Você pode estudar mais ou menos,
            sem bloquear a revisão.
          </p>
        </div>
        <div className="study-plan-control">
          <label htmlFor="review-spacing">Espaçamento das revisões</label>
          <div className="study-plan-value">
            <strong>{number.format(preferences.spacingMultiplier)}×</strong>
            <span>
              {preferences.spacingMultiplier === 1
                ? 'ritmo original'
                : `intervalos ${Math.round((preferences.spacingMultiplier - 1) * 100)}% maiores`}
            </span>
          </div>
          <input
            id="review-spacing"
            type="range"
            min="1"
            max="4"
            step="0.25"
            value={preferences.spacingMultiplier}
            aria-describedby="review-spacing-help"
            onChange={(e) =>
              update({ spacingMultiplier: Number(e.target.value) })
            }
          />
          <div className="study-plan-scale">
            <span>Original · 1×</span>
            <span>Mais espaçado · 4×</span>
          </div>
          <p id="review-spacing-help">
            Vale nas próximas avaliações, sem alterar datas já marcadas. “De
            novo” continua em 1 minuto. Intervalos maiores reduzem a frequência,
            mas podem dificultar a lembrança.
          </p>
        </div>
      </div>
      <div
        className="study-spacing-preview"
        aria-label="Exemplo de intervalos com três respostas Bom"
      >
        <span>Três respostas “Bom” seguidas</span>
        <strong>
          {[first, second, third]
            .map((c) => `${number.format(c.interval)} dias`)
            .join(' → ')}
        </strong>
        <small>
          Intervalo entre revisões de um cartão novo. O aumento se mantém
          proporcional.
        </small>
      </div>
      <div className="study-projection">
        <div className="study-projection-heading">
          <div>
            <h3>Pequenos passos, acervo inteiro</h3>
            <p>
              <strong>{number.format(cards.length)}</strong> flashcards nos
              baralhos ativos · {number.format(due)} para revisar agora
            </p>
          </div>
          {cards.length > 0 && (
            <div className="study-projection-highlight">
              <strong>{milestones[0].days}</strong>
              <span>dias de estudo para uma volta</span>
            </div>
          )}
        </div>
        {cards.length ? (
          <figure
            className="study-milestones"
            aria-label="Estimativa de dias de estudo para revisar todos os flashcards"
          >
            <figcaption>
              A partir de hoje, mantendo {preferences.dailyGoal} flashcards por
              dia
            </figcaption>
            {milestones.map((m) => (
              <div className="study-milestone" key={m.passes}>
                <div className="study-milestone-label">
                  <strong>
                    Cada cartão {m.passes} {m.passes === 1 ? 'vez' : 'vezes'}
                  </strong>
                  <span>
                    {number.format(m.reviews)} revisões ·{' '}
                    <b>{m.days} dias de estudo</b>
                  </span>
                </div>
                <div className="study-milestone-track" aria-hidden="true">
                  <div style={{ width: `${(m.days / maxDays) * 100}%` }} />
                </div>
              </div>
            ))}
            <p>
              Projeção de esforço: total de cartões × voltas ÷ meta diária,
              arredondado para cima. Considera os baralhos ativos a partir de
              hoje; não desconta estudos anteriores. Não é uma data prevista
              pelo agendador: vencimentos, dias de pausa e repetições por
              esquecimento podem alongar o calendário. O espaçamento muda a
              agenda, não a quantidade de revisões desta conta.
            </p>
          </figure>
        ) : (
          <p>
            Ative um baralho ou crie seus primeiros flashcards para visualizar
            seu plano.
          </p>
        )}
      </div>
    </section>
  );
}
