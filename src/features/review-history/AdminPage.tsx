import { useState } from 'react';
import type { Library } from '../library/model';
import { Alert } from '../../shared/ui/Alert';
import { SelectField } from '../../shared/ui/SelectField';
import { dailyActivity, intervalStages, localDay } from './model';
import { useReviewHistory } from './use-review-history';
import { BarChart } from './components/BarChart';
import './admin.css';

const ratingLabels = {
  again: 'De novo',
  hard: 'Difícil',
  good: 'Bom',
  easy: 'Fácil',
};
export default function AdminPage({
  library,
  now,
}: {
  library: Library;
  now: number;
}) {
  const history = useReviewHistory(library);
  const [deckId, setDeckId] = useState('');
  const [metric, setMetric] = useState<'cards' | 'reviews'>('cards');
  const [day, setDay] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const { meta, events } = history.data;
  const snapshot = history.data.library ?? library;
  const decks = new Map([
    ...Object.entries(meta.decks),
    ...snapshot.decks.map((d) => [d.id, d.name] as const),
  ]);
  const cards = snapshot.cards.filter((c) => !deckId || c.deckId === deckId);
  const activity = dailyActivity(history.data, now, deckId);
  const stages = intervalStages(cards);
  const dates = new Set(activity.slice(1).map((d) => d.key));
  const recent = events
    .filter(
      (e) =>
        (!deckId || e.deckId === deckId) && dates.has(localDay(e.reviewedAt)),
    )
    .sort((a, b) => b.reviewedAt - a.reviewedAt);
  const shown = day
    ? recent.filter((e) => localDay(e.reviewedAt) === day)
    : recent;
  const old = Object.entries(meta.undated).filter(
    ([, entry]) => entry.count > 0 && (!deckId || entry.deckId === deckId),
  );
  const selectedStage = stages.find((s) => s.key === stage);
  const stageCards =
    stage === null
      ? []
      : cards.filter(
          (c) =>
            (!c.reviews
              ? 'new'
              : c.interval < 1
                ? 'short'
                : String(Math.round(c.interval))) === stage,
        );
  function question(id: string) {
    const card = snapshot.cards.find((c) => c.id === id);
    if (!card) return 'Cartão removido da biblioteca';
    const text =
      card.front
        .trim()
        .split(/\r?\n/)
        .find((line) => line.trim()) ?? card.front;
    return text.length > 160 ? text.slice(0, 157) + '…' : text;
  }
  return (
    <section className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">SEU RITMO DE ESTUDO</p>
          <h1>Administração dos flashcards</h1>
          <p>Intervalos atuais e atividade dos últimos 30 dias.</p>
        </div>
        <SelectField
          label="Baralho do dashboard"
          value={deckId}
          options={[
            { value: '', label: 'Todos os baralhos' },
            ...[...decks].map(([value, label]) => ({ value, label })),
          ]}
          onChange={(e) => {
            setDeckId(e.target.value);
            setStage(null);
            setDay(null);
          }}
        />
      </header>
      {history.error && (
        <Alert error>
          {history.error}{' '}
          <button onClick={history.reload}>Tentar novamente</button>
        </Alert>
      )}
      {history.data.warning && <Alert>{history.data.warning}</Alert>}
      <div className="admin-stats">
        <article>
          <span>Cartões</span>
          <strong>{cards.length}</strong>
          <small>
            {cards.filter((c) => c.reviews > 0).length} já revisados
          </small>
        </article>
        <article>
          <span>Pendentes agora</span>
          <strong>{cards.filter((c) => c.due <= now).length}</strong>
          <small>Inclui cartões novos</small>
        </article>
        <article>
          <span>Revisões em 30 dias</span>
          <strong>{history.loading ? '—' : recent.length}</strong>
          <small>
            {new Set(recent.map((e) => e.cardId)).size} cartões diferentes
          </small>
        </article>
        <article>
          <span>Revisões sem data</span>
          <strong>{history.loading ? '—' : activity[0].reviews}</strong>
          <small>{activity[0].cards} cartões com histórico anterior</small>
        </article>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <h2>Cartões por intervalo</h2>
            <p>
              Distribuição atual, em dias arredondados. Novos e intervalos
              menores que um dia ficam separados.
            </p>
          </div>
          <span>{cards.length} cartões</span>
        </div>
        <BarChart
          label="Distribuição dos intervalos de revisão"
          points={stages.map((s) => ({
            ...s,
            value: s.count,
            description: `${s.label}: ${s.count} cartões`,
          }))}
          unit="cartões"
          selected={stage}
          onSelect={(key) => setStage(stage === key ? null : key)}
        />
        {selectedStage && (
          <div className="admin-detail">
            <h3>
              {selectedStage.label} · {selectedStage.count} cartões
            </h3>
            <p>
              Intervalos não foram alterados. Mostrando até 20 cartões deste
              grupo.
            </p>
            <ul>
              {stageCards.slice(0, 20).map((c) => (
                <li key={c.id}>
                  {question(c.id)}
                  <small>
                    {c.interval.toLocaleString('pt-BR', {
                      maximumFractionDigits: 3,
                    })}{' '}
                    dia(s) · {c.reviews} revisões
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <h2>Atividade de revisão</h2>
            <p>
              “Sem data”, à esquerda, reúne revisões sem registro de data. As
              demais colunas representam os últimos 30 dias, incluindo hoje.
            </p>
          </div>
          <SelectField
            label="Métrica do gráfico"
            value={metric}
            options={[
              { value: 'cards', label: 'Cartões únicos por dia' },
              { value: 'reviews', label: 'Quantidade de revisões' },
            ]}
            onChange={(e) => setMetric(e.target.value as 'cards' | 'reviews')}
          />
        </div>
        {history.loading ? (
          <p role="status">Abrindo o histórico…</p>
        ) : (
          <BarChart
            label="Atividade dos últimos 30 dias e revisões sem data"
            points={activity.map((row) => ({
              key: row.key,
              label: row.label,
              value: row[metric],
              special: row.undated,
              description: `${row.undated ? 'Sem data' : row.key}: ${row.cards} cartões; ${row.reviews} revisões`,
            }))}
            unit={metric === 'cards' ? 'cartões' : 'revisões'}
            selected={day}
            onSelect={(key) => setDay(day === key ? null : key)}
          />
        )}
        <p className="admin-footnote">
          “Sem data” é um acumulado anterior e usa escala própria. Um cartão
          conta uma vez por dia em “Cartões únicos”; cada avaliação conta em
          “Quantidade de revisões”. Treino livre não entra nestes números.
        </p>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <h2>
              {day === 'undated'
                ? 'Histórico sem data'
                : day
                  ? `Revisões de ${day}`
                  : 'Histórico recente'}
            </h2>
            <p>
              {day === 'undated'
                ? 'Contadores anteriores preservados, sem atribuir datas estimadas.'
                : 'Até 20 avaliações mais recentes da seleção. Toque em uma coluna do gráfico para detalhar um dia.'}
            </p>
          </div>
          {day && (
            <button onClick={() => setDay(null)}>Ver últimos 30 dias</button>
          )}
        </div>
        {day === 'undated' ? (
          old.length ? (
            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Cartão</th>
                    <th>Baralho</th>
                    <th>Revisões sem data</th>
                  </tr>
                </thead>
                <tbody>
                  {old.slice(0, 20).map(([id, entry]) => (
                    <tr key={id}>
                      <td>{question(id)}</td>
                      <td>{decks.get(entry.deckId) ?? entry.deckId}</td>
                      <td>{entry.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Nenhuma revisão sem data nesta seleção.</p>
          )
        ) : shown.length ? (
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cartão</th>
                  <th>Avaliação</th>
                  <th>Intervalo após revisar</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, 20).map((event) => (
                  <tr key={event.id}>
                    <td>
                      {new Date(event.reviewedAt).toLocaleString('pt-BR')}
                    </td>
                    <td>
                      {question(event.cardId)}
                      <small>{decks.get(event.deckId) ?? event.deckId}</small>
                    </td>
                    <td>{ratingLabels[event.rating]}</td>
                    <td>
                      {event.intervalAfter < 1
                        ? '<1 dia'
                        : `${event.intervalAfter.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} dia(s)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Nenhuma revisão com data nesta seleção. As próximas avaliações
            aparecerão aqui.
          </p>
        )}
      </section>
      <p className="admin-footnote">
        Histórico deste aparelho, salvo localmente e copiado para o
        localStorage. Progresso e espaçamento anteriores permanecem preservados.
      </p>
    </section>
  );
}
