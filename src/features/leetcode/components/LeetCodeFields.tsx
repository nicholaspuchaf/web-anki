import { useState } from 'react';
import { SelectField } from '../../../shared/ui/SelectField';
import { languageOptions } from '../languages';
import { TextField } from '../../../shared/ui/TextField';
import { Button } from '../../../shared/ui/Button';
import {
  createFace,
  faceLabels,
  normalizeTags,
  type LeetCode,
  type FaceKind,
  type CardFace,
} from '../model';

type Props = { value: LeetCode; onChange: (value: LeetCode) => void };
export function LeetCodeFields({ value, onChange }: Props) {
  const [tagDraft, setTagDraft] = useState<string | null>(null);
  const patch = (data: Partial<LeetCode>) => onChange({ ...value, ...data });
  const changeFace = (id: string, data: Partial<CardFace>) =>
    patch({
      faces: value.faces.map((f) => (f.id === id ? { ...f, ...data } : f)),
    });
  function move(index: number, direction: number) {
    const faces = [...value.faces];
    const target = index + direction;
    if (target < 0 || target >= faces.length) return;
    [faces[index], faces[target]] = [faces[target], faces[index]];
    patch({ faces });
  }
  return (
    <div className="lc-fields">
      <div className="form-grid">
        <TextField
          label="Número do problema"
          value={value.number}
          onChange={(e) => patch({ number: e.target.value })}
          placeholder="Ex.: 1"
          maxLength={20}
        />
        <SelectField
          label="Dificuldade"
          value={value.difficulty}
          options={[
            { value: 'easy', label: 'Fácil' },
            { value: 'medium', label: 'Médio' },
            { value: 'hard', label: 'Difícil' },
          ]}
          onChange={(e) =>
            patch({ difficulty: e.target.value as LeetCode['difficulty'] })
          }
        />
      </div>
      <TextField
        label="Tags separadas por vírgula"
        value={tagDraft ?? value.tags.join(', ')}
        onChange={(e) => {
          setTagDraft(e.target.value);
          patch({ tags: normalizeTags(e.target.value) });
        }}
        onBlur={() => setTagDraft(null)}
        placeholder="array, hash map, two pointers"
      />
      <TextField
        multiline
        label="Restrições e casos de borda"
        value={value.constraints}
        onChange={(e) => patch({ constraints: e.target.value })}
        placeholder="Observações extras sobre casos de borda (opcional)"
      />
      <SelectField
        label="Cor do cartão"
        value={value.accent}
        options={[
          { value: 'forest', label: 'Floresta' },
          { value: 'indigo', label: 'Índigo' },
          { value: 'amber', label: 'Âmbar' },
        ]}
        onChange={(e) =>
          patch({ accent: e.target.value as LeetCode['accent'] })
        }
      />
      <div className="editor-heading">
        <h3>Versos do cartão</h3>
        <p>
          Todos os versos são opcionais. Preencha só o que quiser revisar; os
          vazios ficam ocultos.
        </p>
      </div>
      {value.faces.map((face, index) => (
        <fieldset className="face-editor" key={face.id}>
          <legend>
            {faceLabels[face.kind]} · {index + 1}
          </legend>
          <div className="face-controls">
            <Button
              aria-label={`Mover verso ${index + 1} para cima`}
              disabled={!index}
              onClick={() => move(index, -1)}
            >
              ↑
            </Button>
            <Button
              aria-label={`Mover verso ${index + 1} para baixo`}
              disabled={index === value.faces.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                patch({ faces: value.faces.filter((f) => f.id !== face.id) })
              }
            >
              Remover verso {index + 1}
            </Button>
          </div>
          {(face.kind === 'hint' || face.kind === 'notes') && (
            <TextField
              label={`Título do verso ${index + 1}`}
              value={face.title}
              onChange={(e) => changeFace(face.id, { title: e.target.value })}
            />
          )}
          {face.kind === 'solution' && (
            <SelectField
              label={`Linguagem do verso ${index + 1}`}
              options={languageOptions(face.language)}
              value={face.language}
              onChange={(e) =>
                changeFace(face.id, { language: e.target.value })
              }
            />
          )}
          <TextField
            multiline
            className={face.kind === 'solution' ? 'code-input' : ''}
            label={`Conteúdo do verso ${index + 1}`}
            value={face.content}
            onChange={(e) => changeFace(face.id, { content: e.target.value })}
            placeholder={
              face.kind === 'hint'
                ? 'Dê uma pista sem entregar a solução.'
                : face.kind === 'solution'
                  ? 'Cole sua solução aqui.'
                  : face.kind === 'complexity'
                    ? 'Tempo: O(n) — explique por quê.\nEspaço: O(n) — quais estruturas são usadas?'
                    : 'Explique seu raciocínio com suas palavras.'
            }
          />
        </fieldset>
      ))}
      <div className="add-faces">
        {(Object.keys(faceLabels) as FaceKind[]).map((kind) => (
          <Button
            key={kind}
            onClick={() => patch({ faces: [...value.faces, createFace(kind)] })}
          >
            + {faceLabels[kind]}
          </Button>
        ))}
      </div>
      {!value.faces.length && (
        <p>Você pode salvar só a pergunta e adicionar versos depois.</p>
      )}
    </div>
  );
}
