import type { Library } from '../library/model';
import type { SaveLibrary } from '../library/hooks/use-library';
import {
  feedDecks,
  carouselDeckId,
  GENERAL_DECK,
  selectDeckFeed,
} from './decks';
import { CarouselLibrary } from './components/CarouselLibrary';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '../../shared/ui/Alert';
import {
  dueCarousels,
  MAX_FEED_BACKUP_BYTES,
  newCarousel,
  parseFeed,
  type Carousel,
  type FeedDraft,
} from './model';
import {
  deleteCarousel,
  loadDraft,
  markSlideRead,
  replaceFeed,
  saveCarousel,
  saveDraft,
} from './repository';
import { useFeed } from './use-feed';
import { FeedEditor } from './components/FeedEditor';
import { FeedStream } from './components/FeedStream';
import { FeedMenu } from './components/FeedMenu';

export default function FeedPage({
  now,
  library,
  libraryReady,
  libraryBusy,
  saveLibrary,
}: {
  now: number;
  library: Library;
  libraryReady: boolean;
  libraryBusy: boolean;
  saveLibrary: SaveLibrary;
}) {
  const feed = useFeed();
  const [menu, setMenu] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(
    () =>
      new URLSearchParams(window.location.hash.split('?')[1]).get('deck') ?? '',
  );
  const [initialCarouselId, setInitialCarouselId] = useState<string>();
  const [mode, setMode] = useState<'feed' | 'manage'>(() =>
    selectedDeck ? 'manage' : 'feed',
  );
  const [editor, setEditor] = useState<{
    initial: FeedDraft;
    draftKey: string;
    recovered: boolean;
  } | null>(null);
  const [opening, setOpening] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [notice, setNotice] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const decks = feedDecks(feed.data, library.decks);
  const studyData = selectDeckFeed(feed.data, selectedDeck);
  const due = dueCarousels(studyData, now).length;
  useEffect(() => {
    if (!feed.ready || !libraryReady || libraryBusy) return;
    const missing = decks.filter(
      (d) => !library.decks.some((existing) => existing.id === d.id),
    );
    if (missing.length)
      void saveLibrary({ ...library, decks: [...library.decks, ...missing] });
  }, [feed.ready, libraryReady, libraryBusy, decks, library, saveLibrary]);
  function study(carousel?: Carousel) {
    if (carousel) setSelectedDeck(carouselDeckId(carousel));
    setInitialCarouselId(carousel?.id);
    setEpoch((value) => value + 1);
    setMode('feed');
  }
  async function open(carousel?: Carousel) {
    setOpening(true);
    try {
      const key = carousel?.id ?? 'new';
      const draft = await loadDraft(key);
      setEditor({
        initial: draft ?? {
          carousel: carousel
            ? structuredClone(carousel)
            : { ...newCarousel(), deckId: selectedDeck || GENERAL_DECK.id },
          expectedRevision: carousel?.revision ?? null,
        },
        draftKey: key,
        recovered: !!draft,
      });
    } catch {
      feed.setError('Não foi possível recuperar o rascunho. Tente novamente.');
    } finally {
      setOpening(false);
    }
  }
  function download() {
    const blob = new Blob([JSON.stringify({ ...feed.data, decks })], {
      type: 'application/json',
    });
    if (blob.size > MAX_FEED_BACKUP_BYTES) {
      feed.setError(
        'O backup excedeu 30 MB. Reduza as imagens antes de exportar.',
      );
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `folha-feed-${new Date(now).toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setNotice('Backup do Feed exportado com carrosséis, imagens e progresso.');
  }
  const signature = studyData.carousels
    .map((c) => `${c.id}:${c.revision}`)
    .join('|');
  return (
    <section className="feed-page">
      <div className="feed-topbar">
        <button
          className="feed-menu-trigger"
          aria-label="Abrir menu do Feed"
          aria-haspopup="dialog"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          ☰
        </button>
        <h1>Feed</h1>
        <div className="feed-mode-switch" aria-label="Visualização do Feed">
          <button
            aria-pressed={mode === 'feed'}
            onClick={() => setMode('feed')}
          >
            Aprender
          </button>
          <button
            aria-pressed={mode === 'manage'}
            onClick={() => setMode('manage')}
          >
            Meus carrosséis
          </button>
        </div>
        <span className="feed-day-count">
          {due} para hoje · {studyData.carousels.length} temas
        </span>
        <button
          className="primary feed-create"
          disabled={!feed.ready || opening}
          onClick={() => void open()}
        >
          + Novo carrossel
        </button>
      </div>
      {feed.error && (
        <Alert error onDismiss={() => feed.setError('')}>
          {feed.error}
        </Alert>
      )}
      {notice && <Alert onDismiss={() => setNotice('')}>{notice}</Alert>}
      {!feed.ready ? (
        <p role="status">Abrindo seu Feed…</p>
      ) : mode === 'feed' && !studyData.carousels.length ? (
        <div className="feed-empty">
          <span aria-hidden="true">✦</span>
          <h2>Um novo espaço para suas ideias</h2>
          <p>
            Crie um carrossel com um objetivo claro e desenvolva o tema card por
            card.
          </p>
          <button onClick={() => void open()} disabled={opening}>
            Criar primeiro carrossel
          </button>
        </div>
      ) : mode === 'feed' ? (
        <div className="feed-layout">
          <FeedStream
            key={`${selectedDeck}:${signature}:${epoch}`}
            data={studyData}
            initialCarouselId={initialCarouselId}
            paused={editor !== null || menu || !!feed.error}
            now={now}
            onRead={(carousel, id) => {
              void feed.perform(() => markSlideRead(carousel, id, Date.now()));
            }}
          />
        </div>
      ) : (
        <CarouselLibrary
          data={feed.data}
          decks={
            decks.some((d) => d.id === GENERAL_DECK.id)
              ? decks
              : [...decks, GENERAL_DECK]
          }
          cards={library.cards}
          selected={selectedDeck}
          onSelect={(id) => {
            setSelectedDeck(id);
            setInitialCarouselId(undefined);
          }}
          onStudy={study}
          onEdit={(carousel) => void open(carousel)}
          busy={opening}
          onDelete={(carousel) => {
            if (
              window.confirm(
                `Excluir o carrossel “${carousel.title}” e seu progresso?`,
              )
            )
              void feed.perform(() =>
                deleteCarousel(carousel.id, carousel.revision),
              );
          }}
        />
      )}
      <input
        ref={file}
        hidden
        type="file"
        accept="application/json,.json"
        aria-label="Arquivo de backup do Feed"
        onChange={async (event) => {
          const input = event.target.files?.[0];
          event.target.value = '';
          if (!input) return;
          try {
            if (input.size > MAX_FEED_BACKUP_BYTES)
              throw new Error('O backup do Feed deve ter até 30 MB.');
            const next = parseFeed(JSON.parse(await input.text()));
            if (
              !window.confirm(
                `Restaurar ${next.carousels.length} carrossel(is)? Apenas o Feed deste aparelho será substituído.`,
              )
            )
              return;
            if (await feed.perform(() => replaceFeed(next))) {
              setSelectedDeck('');
              setInitialCarouselId(undefined);
              setEpoch((value) => value + 1);
              setNotice('Feed restaurado. Seus flashcards foram preservados.');
            }
          } catch (cause) {
            feed.setError(
              cause instanceof Error
                ? cause.message
                : 'Não foi possível importar o Feed.',
            );
          }
        }}
      />
      {menu && (
        <FeedMenu
          ready={feed.ready}
          opening={opening}
          onClose={() => setMenu(false)}
          onLearn={() => setMode('feed')}
          onManage={() => setMode('manage')}
          onCreate={() => void open()}
          onExport={download}
          onImport={() => file.current?.click()}
        />
      )}
      {editor && (
        <FeedEditor
          key={editor.initial.carousel.id}
          {...editor}
          decks={
            decks.some((d) => d.id === GENERAL_DECK.id)
              ? decks
              : [...decks, GENERAL_DECK]
          }
          onClose={() => setEditor(null)}
          onSave={async (value, expected) => {
            const next = await saveCarousel(
              value,
              expected,
              decks.find((d) => d.id === carouselDeckId(value)),
            );
            feed.setData(next);
            feed.setError('');
            try {
              await saveDraft(editor.draftKey, null);
            } catch {
              setNotice(
                'Carrossel salvo. Não foi possível remover a cópia do rascunho.',
              );
            }
            setEditor(null);
          }}
        />
      )}
    </section>
  );
}
