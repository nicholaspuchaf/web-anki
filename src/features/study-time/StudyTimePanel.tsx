import { useMemo, useState } from 'react';
import type { Library } from '../library/model';
import { formatStudyTime } from '../review/study-timer';
import { BarChart } from '../review-history/components/BarChart';
import { Alert } from '../../shared/ui/Alert';
import { studyTimeSummary } from './model';
import { useStudyTime } from './use-study-time';

export function StudyTimePanel({
  library,
  deckId,
  now,
}: {
  library: Library;
  deckId: string;
  now: number;
}) {
  const data = useStudyTime();
  const [day, setDay] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const summary = useMemo(
    () => studyTimeSummary(data.records, now, deckId, day),
    [data.records, now, deckId, day],
  );
  const cards = new Map(library.cards.map((card) => [card.id, card]));
  const decks = new Map(library.decks.map((deck) => [deck.id, deck.name]));
  const question = (id: string) =>
    cards.get(id)?.front ?? `Cartão removido · ${id}`;
  const rows = summary.cards.filter((row) =>
    question(row.cardId)
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const currentPage = Math.min(page, pages - 1);
  return (
    <>
      {data.warning && <Alert error>{data.warning}</Alert>}
      <div className="admin-stats" aria-label="Resumo do tempo de estudo">
        <article>
          <span>Tempo de estudo em 30 dias</span>
          <strong>{formatStudyTime(summary.totalMs)}</strong>
          <small>Tempo ativo, incluindo treino livre</small>
        </article>
        <article>
          <span>Média por passagem</span>
          <strong>{formatStudyTime(summary.averageMs)}</strong>
          <small>{summary.visits} passagens cronometradas</small>
        </article>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <h2>Tempo de estudo por dia</h2>
            <p>
              Últimos 30 dias, incluindo hoje. Toque numa coluna para detalhar o
              dia.
            </p>
          </div>
        </div>
        <BarChart
          label="Tempo de estudo dos últimos 30 dias"
          points={summary.daily.map((row) => ({
            key: row.key,
            label: row.label,
            value: row.durationMs / 1000,
            formattedValue: formatStudyTime(row.durationMs),
            description: `${row.key}: ${formatStudyTime(row.durationMs)} de estudo ativo`,
          }))}
          unit="de estudo"
          selected={day}
          onSelect={(key) => {
            setDay(day === key ? null : key);
            setPage(0);
          }}
        />
        <p className="admin-footnote">
          Sessões em andamento e cartões sem avaliação também contam. O tempo
          pausa fora da revisão ou com a aba oculta. Estudos anteriores a esta
          atualização não possuem duração recuperável e não entram nas médias.
        </p>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <h2>Tempo por flashcard</h2>
            <p>
              {day ? `Estudo de ${day}` : 'Últimos 30 dias'} · média = tempo
              ativo dividido pelas passagens cronometradas.
            </p>
          </div>
          {day && (
            <button
              onClick={() => {
                setDay(null);
                setPage(0);
              }}
            >
              Todos os dias
            </button>
          )}
        </div>
        <label>
          Buscar cartão por tempo
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </label>
        {rows.length ? (
          <>
            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Cartão</th>
                    <th>Tempo total</th>
                    <th>Passagens</th>
                    <th>Tempo médio</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .slice(currentPage * 20, (currentPage + 1) * 20)
                    .map((row) => (
                      <tr key={row.cardId}>
                        <td>
                          {question(row.cardId)}
                          <small>{decks.get(row.deckId) ?? row.deckId}</small>
                        </td>
                        <td>{formatStudyTime(row.durationMs)}</td>
                        <td>{row.visits}</td>
                        <td>{formatStudyTime(row.averageMs)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="study-time-pagination">
              <button
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </button>
              <span>
                Página {currentPage + 1} de {pages} · {rows.length} cartões
              </span>
              <button
                disabled={currentPage + 1 >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        ) : (
          <p>Nenhum tempo de estudo registrado nesta seleção.</p>
        )}
      </section>
    </>
  );
}
