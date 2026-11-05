import { useRef, useState } from 'react';
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

export default function FeedPage({ now }: { now: number }) {
  const feed = useFeed();
  const [mode, setMode] = useState<'feed' | 'manage'>('feed');
  const [editor, setEditor] = useState<{
    initial: FeedDraft;
    draftKey: string;
    recovered: boolean;
  } | null>(null);
  const [opening, setOpening] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [notice, setNotice] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const due = dueCarousels(feed.data, now).length;
  async function open(carousel?: Carousel) {
    setOpening(true);
    try {
      const key = carousel?.id ?? 'new';
      const draft = await loadDraft(key);
      setEditor({
        initial: draft ?? {
          carousel: carousel ? structuredClone(carousel) : newCarousel(),
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
    const blob = new Blob([JSON.stringify(feed.data)], {
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
  const signature = feed.data.carousels
    .map((c) => `${c.id}:${c.revision}`)
    .join('|');
  return (
    <section className="feed-page">
      <div className="feed-topbar">
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
          {due} para hoje · {feed.data.carousels.length} temas
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
      ) : !feed.data.carousels.length ? (
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
          <aside className="feed-guide">
            <span className="feed-guide-icon" aria-hidden="true">
              ✦
            </span>
            <h2>Aprender tem seu ritmo.</h2>
            <p>
              Deslize para o lado para continuar uma ideia. Role para baixo para
              descobrir outro tema.
            </p>
            <p>
              Ao chegar ao fim de todos os cards, o carrossel volta depois do
              intervalo escolhido.
            </p>
            {due === 0 && (
              <p>
                Temas do dia concluídos. Agora você pode reler aleatoriamente,
                sem mudar suas próximas datas.
              </p>
            )}
            <button onClick={() => setEpoch((value) => value + 1)}>
              Atualizar fila
            </button>
            <small>Seu conteúdo e progresso ficam neste aparelho.</small>
          </aside>
          <FeedStream
            key={`${signature}:${epoch}`}
            data={feed.data}
            paused={editor !== null || !!feed.error}
            now={now}
            onRead={(carousel, id) => {
              void feed.perform(() => markSlideRead(carousel, id, Date.now()));
            }}
            onEdit={(carousel) => void open(carousel)}
          />
        </div>
      ) : (
        <div className="feed-manager">
          {feed.data.carousels.map((carousel) => (
            <article key={carousel.id}>
              <div>
                <span className="eyebrow">
                  {carousel.slides.length} CARDS · A CADA{' '}
                  {carousel.intervalDays} DIA(S)
                </span>
                <h2>{carousel.title}</h2>
                <p>{carousel.objective}</p>
              </div>
              <div>
                <button onClick={() => void open(carousel)} disabled={opening}>
                  Editar
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Excluir o carrossel “${carousel.title}” e seu progresso?`,
                      )
                    )
                      await feed.perform(() =>
                        deleteCarousel(carousel.id, carousel.revision),
                      );
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {feed.ready && (
        <div className="feed-backup-tools">
          <button onClick={download}>Exportar Feed</button>
          <button onClick={() => file.current?.click()}>Importar Feed</button>
          <small>
            Backup separado dos flashcards. Rascunhos não entram na exportação.
          </small>
        </div>
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
      {editor && (
        <FeedEditor
          key={editor.initial.carousel.id}
          {...editor}
          onClose={() => setEditor(null)}
          onSave={async (value, expected) => {
            const next = await saveCarousel(value, expected);
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
