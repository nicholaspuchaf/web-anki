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
        <label>
          Dificuldade
          <select
            value={value.difficulty}
            onChange={(e) =>
              patch({ difficulty: e.target.value as LeetCode['difficulty'] })
            }
          >
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>
        </label>
      </div>
      <TextField
        label="Link do problema (HTTPS)"
        type="url"
        value={value.url}
        onChange={(e) => patch({ url: e.target.value })}
        placeholder="https://leetcode.com/problems/..."
      />
      <TextField
        label="Tags separadas por vírgula"
        defaultValue={value.tags.join(', ')}
        onChange={(e) => patch({ tags: normalizeTags(e.target.value) })}
        placeholder="array, hash map, two pointers"
      />
      <TextField
        multiline
        label="Restrições e casos de borda"
        value={value.constraints}
        onChange={(e) => patch({ constraints: e.target.value })}
        placeholder="Observações extras sobre casos de borda (opcional)"
      />
      <label>
        Cor do cartão
        <select
          value={value.accent}
          onChange={(e) =>
            patch({ accent: e.target.value as LeetCode['accent'] })
          }
        >
          <option value="forest">Floresta</option>
          <option value="indigo">Índigo</option>
          <option value="amber">Âmbar</option>
        </select>
      </label>
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
