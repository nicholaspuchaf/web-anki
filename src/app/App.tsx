import { useCloudSync } from '../features/sync/use-cloud-sync';
import { CloudSyncPanel } from '../features/sync/CloudSyncPanel';
import { lazy, Suspense, useRef, useState } from 'react';
import { usePage } from './use-page';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { Card } from '../features/library/model';
import { useLibrary } from '../features/library/hooks/use-library';
import { useReview } from '../features/review/use-review';
import { useBackup } from '../features/backup/use-backup';
import { useOnline } from '../shared/hooks/use-online';
import { useClock } from '../shared/hooks/use-clock';
import { AppLayout } from './AppLayout';
import { Alert } from '../shared/ui/Alert';
import { LibraryPage } from '../features/library/components/LibraryPage';
import { DeckPage } from '../features/library/components/DeckPage';
import { ReviewPage } from '../features/review/ReviewPage';
import { LibraryEditor } from '../features/library/components/LibraryEditor';

const AdminPage = lazy(() => import('../features/review-history/AdminPage'));
const FeedPage = lazy(() => import('../features/feed/FeedPage'));

export default function App() {
  const page = usePage();
  const {
    library,
    ready,
    busy: saving,
    error,
    setError,
    save,
    reload,
  } = useLibrary();
  const cloud = useCloudSync(
    import.meta.env.VITE_API_URL ?? '',
    library,
    reload,
  );
  const busy = saving || cloud.working;
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<'decks' | 'cards' | 'review'>('decks');
  const [modal, setModal] = useState<'deck' | 'card' | null>(null);
  const [editing, setEditing] = useState<Card | null>(null);
  const now = useClock();
  const online = useOnline();
  const review = useReview(library, save);
  const { exportBackup, importBackup } = useBackup(
    library,
    save,
    setError,
    setNotice,
  );
  const file = useRef<HTMLInputElement>(null);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const deck = library.decks.find((d) => d.id === selected);

  function begin(
    deckId?: string,
    options?: { ids?: string[]; practice?: boolean },
  ) {
    review.begin(deckId, options);
    setView('review');
  }

  return (
    <AppLayout
      online={online}
      page={page}
      onHome={() => {
        window.location.hash = '/';
        setView('decks');
      }}
    >
      <main className={page === 'feed' ? 'feed-main' : undefined}>
        {error && (
          <Alert error onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        {notice && <Alert onDismiss={() => setNotice('')}>{notice}</Alert>}
        {needRefresh && (
          <div className="alert">
            Uma nova versão está disponível.
            <button
              onClick={() => updateServiceWorker(true)}
              disabled={busy || view === 'review'}
            >
              Atualizar
            </button>
          </div>
        )}
        {page === 'feed' ? (
          <Suspense fallback={<p role="status">Abrindo o Feed…</p>}>
            <FeedPage
              now={now}
              library={library}
              libraryReady={ready}
              saveLibrary={save}
              libraryBusy={busy}
            />
          </Suspense>
        ) : !ready ? (
          <div className="empty">
            <p>
              {error
                ? 'Seus dados não foram alterados.'
                : 'Abrindo seus cartões…'}
            </p>
          </div>
        ) : page === 'admin' ? (
          <Suspense fallback={<p role="status">Abrindo a administração…</p>}>
            <AdminPage library={library} now={now} />
          </Suspense>
        ) : (
          <>
            {view === 'decks' && (
              <>
                <LibraryPage
                  library={library}
                  now={now}
                  busy={busy}
                  begin={() => begin()}
                  onCreateDeck={() => setModal('deck')}
                  onOpenDeck={(id) => {
                    setSelected(id);
                    setView('cards');
                  }}
                  exportBackup={exportBackup}
                  onImport={() => file.current?.click()}
                />
                {import.meta.env.VITE_API_URL && (
                  <CloudSyncPanel library={library} cloud={cloud} busy={busy} />
                )}
              </>
            )}
            {view === 'cards' && deck && (
              <DeckPage
                library={library}
                deck={deck}
                now={now}
                busy={busy}
                save={save}
                begin={begin}
                onBack={() => setView('decks')}
                onEdit={(card) => {
                  setEditing(card);
                  setModal('card');
                }}
              />
            )}
            {view === 'review' && (
              <ReviewPage
                library={library}
                review={review}
                busy={busy}
                now={now}
                onBack={() => setView('decks')}
              />
            )}
          </>
        )}
      </main>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const input = e.target.files?.[0];
          if (input)
            void importBackup(input).then((restored) => {
              if (restored) {
                setView('decks');
                setSelected('');
              }
            });
          e.target.value = '';
        }}
      />
      {modal && (
        <LibraryEditor
          modal={modal}
          editing={editing}
          selected={selected}
          library={library}
          busy={busy}
          save={save}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
        />
      )}
    </AppLayout>
  );
}
