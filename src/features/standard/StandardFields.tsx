import { TextField } from '../../shared/ui/TextField';
import { Button } from '../../shared/ui/Button';
import type { StudyFace } from './model';

export function StandardFields({
  faces,
  onChange,
}: {
  faces: StudyFace[];
  onChange: (faces: StudyFace[]) => void;
}) {
  return (
    <div>
      <h3>Versos independentes</h3>
      {faces.map((face, index) => (
        <fieldset className="face-editor" key={face.id}>
          <legend>Verso {index + 1}</legend>
          <TextField
            label={`Título do verso ${index + 1}`}
            value={face.title}
            onChange={(event) =>
              onChange(
                faces.map((item) =>
                  item.id === face.id
                    ? { ...item, title: event.target.value }
                    : item,
                ),
              )
            }
          />
          <TextField
            multiline
            label={`Conteúdo do verso ${index + 1}`}
            value={face.content}
            onChange={(event) =>
              onChange(
                faces.map((item) =>
                  item.id === face.id
                    ? { ...item, content: event.target.value }
                    : item,
                ),
              )
            }
          />
          <Button
            variant="danger"
            onClick={() =>
              onChange(faces.filter((item) => item.id !== face.id))
            }
          >
            Remover verso {index + 1}
          </Button>
        </fieldset>
      ))}
      <Button
        onClick={() =>
          onChange([
            ...faces,
            {
              id: crypto.randomUUID(),
              title: `Verso ${faces.length + 1}`,
              content: '',
            },
          ])
        }
      >
        + Adicionar verso
      </Button>
    </div>
  );
}
