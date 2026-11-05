import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { TextField } from '../../../shared/ui/TextField';
import { Alert } from '../../../shared/ui/Alert';
import {
  newSlide,
  parseCarousel,
  type Carousel,
  type FeedBlock,
  type FeedDraft,
} from '../model';
import { saveDraft } from '../repository';
import { readFeedImage } from '../image';
import { LearningCarousel } from './LearningCarousel';

function move<T>(items: T[], index: number, delta: number): T[] {
  const result = [...items];
  const target = index + delta;
  if (target >= 0 && target < result.length)
    [result[index], result[target]] = [result[target], result[index]];
  return result;
}
export function FeedEditor({
  initial,
  draftKey,
  recovered,
  onSave,
  onClose,
}: {
  initial: FeedDraft;
  draftKey: string;
  recovered: boolean;
  onSave: (value: Carousel, expectedRevision: number | null) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial.carousel);
  const [tags, setTags] = useState(initial.carousel.tags.join(', '));
  const [slideId, setSlideId] = useState(initial.carousel.slides[0].id);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftStatus, setDraftStatus] = useState(
    recovered
      ? 'Rascunho recuperado deste aparelho.'
      : 'O rascunho é salvo automaticamente.',
  );
  const index = value.slides.findIndex((slide) => slide.id === slideId);
  const slide = value.slides[index];
  useEffect(() => {
    if (busy) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void saveDraft(draftKey, {
        carousel: value,
        expectedRevision: initial.expectedRevision,
      })
        .then(() => {
          if (active) setDraftStatus('Rascunho salvo neste aparelho.');
        })
        .catch(() => {
          if (active)
            setDraftStatus(
              'Não foi possível guardar o rascunho. Tente salvar ou liberar espaço.',
            );
        });
    }, 600);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draftKey, value, initial.expectedRevision, busy]);
  function changeBlocks(blocks: FeedBlock[]) {
    setValue({
      ...value,
      slides: value.slides.map((s) =>
        s.id === slideId ? { ...s, blocks } : s,
      ),
    });
  }
  function changeBlock(id: string, block: FeedBlock) {
    changeBlocks(slide.blocks.map((b) => (b.id === id ? block : b)));
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = [...files];
    const targetId = slideId;
    if (slide.blocks.length + selected.length > 40) {
      setError('Use no máximo 40 blocos por card.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const images: FeedBlock[] = [];
      for (const file of selected)
        images.push({
          id: crypto.randomUUID(),
          type: 'image',
          src: await readFeedImage(file),
          alt: '',
          caption: '',
        });
      setValue((current) => ({
        ...current,
        slides: current.slides.map((s) =>
          s.id === targetId ? { ...s, blocks: [...s.blocks, ...images] } : s,
        ),
      }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível abrir a imagem.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        initial.expectedRevision === null
          ? 'Novo carrossel'
          : 'Editar carrossel'
      }
      wide
      busy={busy}
      onClose={onClose}
    >
      <form
        className="feed-editor"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            const parsed = parseCarousel(value);
            await onSave(parsed, initial.expectedRevision);
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : 'Não foi possível salvar. Seu rascunho foi preservado.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="feed-editor-intro">
          Um tema por carrossel. Uma ideia por card. Desenvolva a explicação com
          texto, listas e imagens.
        </p>
        {error && (
          <Alert error onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        {!preview && (
          <fieldset disabled={busy} className="feed-editor-metadata">
            <TextField
              label="Título do carrossel"
              value={value.title}
              maxLength={180}
              onChange={(e) => setValue({ ...value, title: e.target.value })}
              placeholder="Ex.: Entendendo cache além da performance"
            />
            <TextField
              label="Escopo"
              value={value.scope}
              maxLength={500}
              onChange={(e) => setValue({ ...value, scope: e.target.value })}
              placeholder="O que este carrossel cobre — e até onde ele vai"
            />
            <TextField
              label="Objetivo de aprendizado"
              multiline
              value={value.objective}
              maxLength={800}
              onChange={(e) =>
                setValue({ ...value, objective: e.target.value })
              }
              placeholder="Ao terminar, quero conseguir explicar…"
            />
            <div className="feed-editor-row">
              <TextField
                label="Tags (separadas por vírgula)"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  setValue({
                    ...value,
                    tags: e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  });
                }}
              />
              <TextField
                label="Reapresentar após (dias)"
                type="number"
                min={1}
                max={30}
                value={value.intervalDays}
                onChange={(e) =>
                  setValue({ ...value, intervalDays: Number(e.target.value) })
                }
              />
            </div>
          </fieldset>
        )}
        <div className="feed-editor-tools">
          <h3>{value.slides.length} card(s)</h3>
          <button type="button" onClick={() => setPreview(!preview)}>
            {preview ? 'Voltar ao editor' : 'Pré-visualizar carrossel'}
          </button>
        </div>
        {preview ? (
          <LearningCarousel carousel={value} now={0} preview />
        ) : (
          <div className="feed-editor-workspace">
            <nav className="feed-editor-slides" aria-label="Cards para editar">
              {value.slides.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  aria-pressed={s.id === slideId}
                  onClick={() => setSlideId(s.id)}
                >
                  <b>{i + 1}</b> <span>{s.title || 'Sem título'}</span>
                </button>
              ))}
              <button
                type="button"
                disabled={busy || value.slides.length >= 30}
                onClick={() => {
                  const next = newSlide();
                  setValue({ ...value, slides: [...value.slides, next] });
                  setSlideId(next.id);
                }}
              >
                + Adicionar card
              </button>
            </nav>
            <fieldset className="feed-editor-card" disabled={busy}>
              <legend>Card {index + 1}</legend>
              <div className="feed-block-actions">
                <button
                  type="button"
                  disabled={!index}
                  aria-label="Mover card para cima"
                  onClick={() =>
                    setValue({
                      ...value,
                      slides: move(value.slides, index, -1),
                    })
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === value.slides.length - 1}
                  aria-label="Mover card para baixo"
                  onClick={() =>
                    setValue({ ...value, slides: move(value.slides, index, 1) })
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={value.slides.length >= 30}
                  onClick={() => {
                    const copy = {
                      ...structuredClone(slide),
                      id: crypto.randomUUID(),
                      blocks: slide.blocks.map((b) => ({
                        ...b,
                        id: crypto.randomUUID(),
                      })),
                    };
                    setValue({
                      ...value,
                      slides: [
                        ...value.slides.slice(0, index + 1),
                        copy,
                        ...value.slides.slice(index + 1),
                      ],
                    });
                    setSlideId(copy.id);
                  }}
                >
                  Duplicar card
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={value.slides.length === 1}
                  onClick={() => {
                    const next = value.slides.filter((s) => s.id !== slideId);
                    setSlideId(next[Math.min(index, next.length - 1)].id);
                    setValue({ ...value, slides: next });
                  }}
                >
                  Remover card
                </button>
              </div>
              <TextField
                label={`Título do card ${index + 1}`}
                value={slide.title}
                maxLength={240}
                onChange={(e) =>
                  setValue({
                    ...value,
                    slides: value.slides.map((s) =>
                      s.id === slideId ? { ...s, title: e.target.value } : s,
                    ),
                  })
                }
              />
              {slide.blocks.map((block, blockIndex) => (
                <div className="feed-block-editor" key={block.id}>
                  <div className="feed-block-heading">
                    <span>
                      {blockIndex + 1} ·{' '}
                      {block.type === 'paragraph'
                        ? 'Parágrafo'
                        : block.type === 'bullets'
                          ? 'Lista'
                          : 'Imagem'}
                    </span>
                    <div className="feed-block-actions">
                      <button
                        type="button"
                        disabled={!blockIndex}
                        aria-label={`Subir bloco ${blockIndex + 1}`}
                        onClick={() =>
                          changeBlocks(move(slide.blocks, blockIndex, -1))
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={blockIndex === slide.blocks.length - 1}
                        aria-label={`Descer bloco ${blockIndex + 1}`}
                        onClick={() =>
                          changeBlocks(move(slide.blocks, blockIndex, 1))
                        }
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`Remover bloco ${blockIndex + 1}`}
                        onClick={() =>
                          changeBlocks(
                            slide.blocks.filter((b) => b.id !== block.id),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {block.type === 'paragraph' ? (
                    <TextField
                      label={`Parágrafo ${blockIndex + 1}`}
                      multiline
                      rows={6}
                      value={block.text}
                      onChange={(e) =>
                        changeBlock(block.id, {
                          ...block,
                          text: e.target.value,
                        })
                      }
                      placeholder="Desenvolva a ideia. Use linhas em branco para separar parágrafos."
                    />
                  ) : block.type === 'bullets' ? (
                    <TextField
                      label={`Lista ${blockIndex + 1} (um item por linha)`}
                      multiline
                      rows={5}
                      value={block.items.join('\n')}
                      onChange={(e) =>
                        changeBlock(block.id, {
                          ...block,
                          items: e.target.value.split('\n'),
                        })
                      }
                      placeholder="Primeiro ponto\nSegundo ponto"
                    />
                  ) : (
                    <>
                      <img
                        className="feed-editor-image"
                        src={block.src}
                        alt={block.alt || 'Imagem selecionada'}
                      />
                      <TextField
                        label={`Descrição da imagem ${blockIndex + 1}`}
                        value={block.alt}
                        onChange={(e) =>
                          changeBlock(block.id, {
                            ...block,
                            alt: e.target.value,
                          })
                        }
                        placeholder="Descreva o conteúdo para quem não pode ver a imagem"
                      />
                      <TextField
                        label={`Legenda da imagem ${blockIndex + 1} (opcional)`}
                        value={block.caption}
                        onChange={(e) =>
                          changeBlock(block.id, {
                            ...block,
                            caption: e.target.value,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              ))}
              <div className="feed-add-blocks">
                <button
                  type="button"
                  disabled={slide.blocks.length >= 40}
                  onClick={() =>
                    changeBlocks([
                      ...slide.blocks,
                      { id: crypto.randomUUID(), type: 'paragraph', text: '' },
                    ])
                  }
                >
                  + Parágrafo
                </button>
                <button
                  type="button"
                  disabled={slide.blocks.length >= 40}
                  onClick={() =>
                    changeBlocks([
                      ...slide.blocks,
                      { id: crypto.randomUUID(), type: 'bullets', items: [''] },
                    ])
                  }
                >
                  + Lista
                </button>
                <label className="feed-upload">
                  + Imagens
                  <input
                    aria-label="Adicionar imagens ao card"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={busy || slide.blocks.length >= 40}
                    onChange={(e) => {
                      void upload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </fieldset>
          </div>
        )}
        <div className="feed-editor-bottom">
          <small role="status">{draftStatus}</small>
          <div>
            <button
              type="button"
              className="text-button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveDraft(draftKey, null);
                  onClose();
                } catch {
                  setError('Não foi possível descartar o rascunho.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Descartar rascunho
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar carrossel'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
