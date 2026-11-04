import { isBundledId } from '../../bundled-decks/ids';
import { getDeckCards, getDueCards } from '../selectors';
import type { Library } from '../model';

type Props = {
  library: Library;
  now: number;
  busy: boolean;
  begin: () => void;
  onCreateDeck: () => void;
  onOpenDeck: (id: string) => void;
  exportBackup: () => void;
  onImport: () => void;
};

export function LibraryPage({
  library,
  now,
  busy,
  begin,
  onCreateDeck,
  onOpenDeck,
  exportBackup,
  onImport,
}: Props) {
  const due = getDueCards(library.cards, now);
  return (
    <>
      <section className="intro">
        <div>
          <p className="eyebrow">SEU WORKSPACE</p>
          <h1>Revisão de cartões</h1>
          <p>Retome o raciocínio. Reconheça os padrões. Resolva de novo.</p>
        </div>
        <div className="library-stats">
          <div>
            <strong>{library.cards.length}</strong>
            <span>Cartões</span>
          </div>
          <div>
            <strong>{due.length}</strong>
            <span>Para revisar</span>
          </div>
          <div>
            <strong>
              {library.cards.filter((card) => card.favorite).length}
            </strong>
            <span>Favoritos</span>
          </div>
        </div>
      </section>
      <section className="study-banner">
        <div>
          <span className="eyebrow">REVISÃO ESPAÇADA</span>
          <h2>
            {due.length
              ? `${due.length} ${due.length === 1 ? 'cartão esperando' : 'cartões esperando'} por você`
              : 'Nenhuma revisão pendente'}
          </h2>
          <p>
            {due.length
              ? 'Revise a abordagem antes de consultar a solução.'
              : 'Crie cartões ou volte quando chegar a próxima revisão.'}
          </p>
        </div>
        <button
          className="light"
          disabled={!due.length || busy}
          onClick={() => begin()}
        >
          Revisar agora <span>↗</span>
        </button>
      </section>
      <section>
        <div className="section-title">
          <h2>
            Seus baralhos{' '}
            <span>{library.decks.length.toString().padStart(2, '0')}</span>
          </h2>
          <button className="primary" onClick={onCreateDeck}>
            + Novo baralho
          </button>
        </div>
        {library.decks.length ? (
          <div className="deck-grid">
            {library.decks.map((d, index) => {
              const items = getDeckCards(library, d.id);
              const pending = getDueCards(items, now).length;
              return (
                <button
                  className="deck"
                  key={d.id}
                  onClick={() => onOpenDeck(d.id)}
                >
                  <div className="deck-top">
                    <span className={`deck-icon tone-${index % 3}`}>▤</span>
                    <span>↗</span>
                  </div>
                  <h3>{d.name}</h3>
                  {d.syncEnabled === false && (
                    <small className="local-deck-badge">
                      {isBundledId(d.id)
                        ? 'Incluído no site · apenas neste aparelho'
                        : 'Apenas neste aparelho'}
                    </small>
                  )}
                  <p>
                    {items.length} {items.length === 1 ? 'cartão' : 'cartões'}
                  </p>
                  <div className="deck-bottom">
                    <span className={pending ? 'pending' : ''}>
                      {pending ? `${pending} para revisar` : 'Em dia'}
                    </span>
                    <span>Abrir baralho →</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <span className="empty-icon">▤</span>
            <h3>Sua lista de problemas começa aqui</h3>
            <p>
              Organize os problemas que você já resolveu por assunto ou
              objetivo.
            </p>
            <button className="text-button" onClick={onCreateDeck}>
              Criar meu primeiro baralho →
            </button>
          </div>
        )}
      </section>
      <section className="backup">
        <div>
          <h3>Backup da biblioteca</h3>
          <p>
            Os cartões ficam neste aparelho. Exporte um backup para guardar ou
            levar para outro dispositivo.
          </p>
        </div>
        <div className="backup-actions">
          <button onClick={exportBackup} disabled={busy}>
            ↓ Exportar backup
          </button>
          <button onClick={onImport} disabled={busy}>
            ↑ Importar backup
          </button>
        </div>
      </section>
      <aside className="install">
        ✧{' '}
        <p>
          <strong>Leve o Folha para a tela inicial.</strong> No Safari do
          iPhone, toque em Compartilhar e depois em “Adicionar à Tela de
          Início”. Após o primeiro carregamento, você pode estudar offline.
        </p>
      </aside>
    </>
  );
}
