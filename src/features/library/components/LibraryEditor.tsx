import { DeckTagFields } from '../../decks/DeckTagFields';
import { deckTagPolicy } from '../../decks/tag-policy';
import { createStudyFaces } from '../../standard/model';
import { StandardFields } from '../../standard/StandardFields';
import { useEffect, useRef, useState } from 'react';
import { useOnline } from '../../../shared/hooks/use-online';
import { addDeck, putCard } from '../commands';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { Alert } from '../../../shared/ui/Alert';
import type { Card, CardTemplate, Library } from '../model';
import { SelectField } from '../../../shared/ui/SelectField';
import {
  createMultipleChoice,
  parseMultipleChoice,
} from '../../multiple-choice/model';
import { MultipleChoiceFields } from '../../multiple-choice/components/MultipleChoiceFields';
import { CardPreview } from './CardPreview';
import type { SaveLibrary } from '../hooks/use-library';
import { createLeetCode, normalizeTags } from '../../leetcode/model';
import { importProblem } from '../../leetcode/import-problem';
import { problemLink } from '../../leetcode/problem-url';
import { LeetCodeFields } from '../../leetcode/components/LeetCodeFields';

type Props = {
  modal: 'deck' | 'card';
  editing: Card | null;
  selected: string;
  library: Library;
  busy: boolean;
  save: SaveLibrary;
  onClose: () => void;
};
export function LibraryEditor({
  modal,
  editing,
  selected,
  library,
  busy,
  save,
  onClose,
}: Props) {
  const [template, setTemplate] = useState(
    editing
      ? editing.multipleChoice
        ? 'multiple-choice'
        : editing.faces
          ? 'multi-face'
          : editing.leetcode
            ? 'leetcode'
            : 'basic'
      : (library.decks.find((deck) => deck.id === selected)?.defaultTemplate ??
          'leetcode'),
  );
  const [deckTemplate, setDeckTemplate] = useState<CardTemplate>('leetcode');
  const [multipleChoice, setMultipleChoice] = useState(
    () => editing?.multipleChoice ?? createMultipleChoice(),
  );
  const [faces, setFaces] = useState(
    () => editing?.faces ?? createStudyFaces(),
  );
  const [cardTags, setCardTags] = useState<string[]>(editing?.tags ?? []);
  const [front, setFront] = useState(editing?.front ?? '');
  const [back, setBack] = useState(editing?.back ?? '');
  const [leetcode, setLeetcode] = useState(
    () => editing?.leetcode ?? createLeetCode(),
  );
  const [createdAt] = useState(() => Date.now());
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const importRequest = useRef<AbortController | null>(null);
  useEffect(() => () => importRequest.current?.abort(), []);
  const editorBusy = busy || importing;
  const online = useOnline();
  async function fillFromLink() {
    if (editorBusy || importRequest.current) return;
    setError('');
    setImportMessage('');
    try {
      problemLink(leetcode.url);
    } catch (cause) {
      setError((cause as Error).message);
      return;
    }
    if (
      (front.trim() || leetcode.number.trim() || leetcode.tags.length) &&
      !window.confirm(
        'Substituir a pergunta, o número e a dificuldade pelos dados do LeetCode? Suas tags personalizadas e seus versos serão mantidos.',
      )
    )
      return;
    const controller = new AbortController();
    importRequest.current = controller;
    setImporting(true);
    try {
      const { problem, description } = await importProblem(
        import.meta.env.VITE_API_URL ?? '',
        leetcode.url,
        AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
      );
      if (controller.signal.aborted) return;
      setFront(description.text);
      setLeetcode((previous) => ({
        ...previous,
        url: problem.url,
        number: problem.number,
        difficulty: problem.difficulty,
        tags: normalizeTags([...previous.tags, ...problem.tags].join(',')),
      }));
      setImportMessage(
        description.hasImages
          ? 'Dados preenchidos. O enunciado contém imagens: consulte o link original para visualizá-las. Seus versos foram mantidos.'
          : 'Enunciado, número, dificuldade e tópicos preenchidos. Revise os campos antes de salvar. Seus versos foram mantidos.',
      );
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error && cause.name !== 'TimeoutError'
            ? cause.message
            : 'A consulta demorou para responder. Tente novamente ou preencha manualmente.',
        );
    } finally {
      if (!controller.signal.aborted) setImporting(false);
      importRequest.current = null;
    }
  }
  const draft: Card = {
    id: editing?.id ?? 'preview',
    deckId: selected,
    front,
    back:
      template === 'multiple-choice' || template === 'multi-face' ? '' : back,
    due: editing?.due ?? createdAt,
    interval: editing?.interval ?? 0,
    ...(editing?.spacingMultiplier !== undefined
      ? { spacingMultiplier: editing.spacingMultiplier }
      : {}),
    reviews: editing?.reviews ?? 0,
    favorite: editing?.favorite ?? false,
    ...(editing?.syncEnabled !== undefined
      ? { syncEnabled: editing.syncEnabled }
      : {}),
    ...(template === 'leetcode' ? { leetcode } : {}),
    ...(template === 'multiple-choice' ? { multipleChoice } : {}),
    ...(template === 'multi-face'
      ? {
          faces,
          ...(editing?.frontImage ? { frontImage: editing.frontImage } : {}),
          ...(editing?.tags ? { tags: editing.tags } : {}),
          ...(editing?.sourceUrl ? { sourceUrl: editing.sourceUrl } : {}),
        }
      : {}),
    ...(deckTagPolicy(selected) ? { tags: cardTags } : {}),
  };
  return (
    <Modal
      title={
        modal === 'deck'
          ? 'Novo baralho'
          : editing
            ? 'Editar cartão'
            : 'Novo cartão'
      }
      busy={editorBusy}
      onClose={onClose}
      wide={modal === 'card' && template === 'leetcode'}
    >
      {error && (
        <Alert error onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {importMessage && <Alert>{importMessage}</Alert>}
      {modal === 'card' && (
        <div className="editor-toolbar">
          <div className="field template-field">
            <label htmlFor="card-template">Template</label>
            <select
              disabled={editorBusy}
              id="card-template"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value as CardTemplate);
                setPreview(false);
              }}
            >
              <option value="leetcode">LeetCode · múltiplos versos</option>
              <option value="basic">Básico · pergunta e resposta</option>
              <option value="multi-face">Básico · vários versos</option>
              <option value="multiple-choice">
                Múltipla escolha · 4 alternativas
              </option>
            </select>
          </div>
          {(template === 'leetcode' ||
            template === 'multiple-choice' ||
            template === 'multi-face') && (
            <Button
              disabled={editorBusy}
              onClick={() => {
                try {
                  if (!preview && template === 'multiple-choice') {
                    if (!front.trim()) throw new Error('Preencha a pergunta.');
                    parseMultipleChoice(multipleChoice);
                  }
                  setError('');
                  setPreview(!preview);
                } catch (cause) {
                  setError((cause as Error).message);
                }
              }}
            >
              {preview ? 'Continuar editando' : 'Pré-visualizar cartão'}
            </Button>
          )}
        </div>
      )}
      {preview ? (
        <CardPreview card={draft} reportable={false} />
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              const next =
                modal === 'deck'
                  ? addDeck(
                      library,
                      String(new FormData(e.currentTarget).get('name')),
                      undefined,
                      deckTemplate,
                    )
                  : putCard(library, {
                      ...draft,
                      id: editing?.id ?? crypto.randomUUID(),
                    });
              if (await save(next)) onClose();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Não foi possível salvar o cartão.',
              );
            }
          }}
        >
          <fieldset className="form-content" disabled={editorBusy}>
            {modal === 'card' && (
              <DeckTagFields
                deckId={selected}
                tags={cardTags}
                onChange={setCardTags}
              />
            )}
            {modal === 'deck' ? (
              <>
                <TextField
                  label="Nome do baralho"
                  name="name"
                  required
                  maxLength={100}
                  placeholder="Ex.: LeetCode · padrões e algoritmos"
                />
                <SelectField
                  label="Template padrão dos cartões"
                  value={deckTemplate}
                  onChange={(event) =>
                    setDeckTemplate(event.target.value as CardTemplate)
                  }
                  options={[
                    { value: 'leetcode', label: 'LeetCode · múltiplos versos' },
                    { value: 'basic', label: 'Básico · pergunta e resposta' },
                    { value: 'multi-face', label: 'Básico · vários versos' },
                    {
                      value: 'multiple-choice',
                      label: 'Múltipla escolha · 4 alternativas',
                    },
                  ]}
                />
              </>
            ) : (
              <>
                {template === 'leetcode' && (
                  <div className="problem-import">
                    <TextField
                      label="Link do problema (HTTPS)"
                      type="url"
                      value={leetcode.url}
                      onChange={(e) =>
                        setLeetcode({ ...leetcode, url: e.target.value })
                      }
                      placeholder="https://leetcode.com/problems/two-sum/"
                    />
                    <Button
                      disabled={editorBusy || !leetcode.url.trim() || !online}
                      onClick={() => void fillFromLink()}
                    >
                      {importing
                        ? 'Consultando LeetCode…'
                        : 'Preencher pelo link'}
                    </Button>
                    <p className="field-help">
                      Importa o enunciado público e usa os tópicos como tags. Os
                      campos continuam editáveis.
                    </p>
                  </div>
                )}
                <TextField
                  multiline
                  label={
                    template === 'leetcode'
                      ? 'Pergunta · título e enunciado'
                      : 'Frente · pergunta'
                  }
                  required
                  maxLength={15000}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder={
                    template === 'leetcode'
                      ? 'Two Sum\nDado um array e um alvo, retorne os índices…'
                      : 'O que você quer lembrar?'
                  }
                />
                {template === 'leetcode' ? (
                  <LeetCodeFields value={leetcode} onChange={setLeetcode} />
                ) : template === 'multi-face' ? (
                  <StandardFields faces={faces} onChange={setFaces} />
                ) : template === 'multiple-choice' ? (
                  <MultipleChoiceFields
                    value={multipleChoice}
                    onChange={setMultipleChoice}
                  />
                ) : (
                  <TextField
                    multiline
                    label="Verso · resposta (opcional)"
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="Escreva uma resposta clara e curta."
                  />
                )}
              </>
            )}
            <Button type="submit" variant="primary" disabled={editorBusy}>
              {importing ? 'Consultando…' : busy ? 'Salvando…' : 'Salvar'}
            </Button>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
