import { useState } from 'react';
import { addDeck, putCard } from '../commands';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { Alert } from '../../../shared/ui/Alert';
import type { Card, Library } from '../model';
import type { SaveLibrary } from '../hooks/use-library';
import { createLeetCode } from '../../leetcode/model';
import { LeetCodeFields } from '../../leetcode/components/LeetCodeFields';
import { LeetCodeCard } from '../../leetcode/components/LeetCodeCard';

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
    editing ? (editing.leetcode ? 'leetcode' : 'basic') : 'leetcode',
  );
  const [front, setFront] = useState(editing?.front ?? '');
  const [back, setBack] = useState(editing?.back ?? '');
  const [leetcode, setLeetcode] = useState(
    () => editing?.leetcode ?? createLeetCode(),
  );
  const [createdAt] = useState(() => Date.now());
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const draft: Card = {
    id: editing?.id ?? 'preview',
    deckId: selected,
    front,
    back,
    due: editing?.due ?? createdAt,
    interval: editing?.interval ?? 0,
    reviews: editing?.reviews ?? 0,
    favorite: editing?.favorite ?? false,
    ...(template === 'leetcode' ? { leetcode } : {}),
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
      busy={busy}
      onClose={onClose}
      wide={modal === 'card' && template === 'leetcode'}
    >
      {error && (
        <Alert error onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {modal === 'card' && (
        <div className="editor-toolbar">
          <div className="field template-field">
            <label htmlFor="card-template">Template</label>
            <select
              disabled={busy}
              id="card-template"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setPreview(false);
              }}
            >
              <option value="leetcode">LeetCode · múltiplos versos</option>
              <option value="basic">Básico · pergunta e resposta</option>
            </select>
          </div>
          {template === 'leetcode' && (
            <Button disabled={busy} onClick={() => setPreview(!preview)}>
              {preview ? 'Continuar editando' : 'Pré-visualizar cartão'}
            </Button>
          )}
        </div>
      )}
      {preview ? (
        <LeetCodeCard card={draft} />
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
          <fieldset className="form-content" disabled={busy}>
            {modal === 'deck' ? (
              <TextField
                label="Nome do baralho"
                name="name"
                required
                maxLength={100}
                placeholder="Ex.: LeetCode · padrões e algoritmos"
              />
            ) : (
              <>
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
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar'}
            </Button>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
