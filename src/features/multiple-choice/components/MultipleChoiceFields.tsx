import { useId } from 'react';
import { TextField } from '../../../shared/ui/TextField';
import { optionLetters, type MultipleChoice } from '../model';

export function MultipleChoiceFields({
  value,
  onChange,
}: {
  value: MultipleChoice;
  onChange: (value: MultipleChoice) => void;
}) {
  const id = useId();
  return (
    <div className="multiple-choice-fields">
      <fieldset className="choice-editor-group">
        <legend>Quatro alternativas · uma resposta correta</legend>
        <p>
          Preencha as alternativas e marque a correta. Essa marcação fica oculta
          durante a revisão.
        </p>
        {optionLetters.map((letter, index) => (
          <div className="choice-editor-option" key={letter}>
            <TextField
              multiline
              label={`Alternativa ${letter}`}
              required
              value={value.options[index]}
              onChange={(event) => {
                const options = [...value.options] as MultipleChoice['options'];
                options[index] = event.target.value;
                onChange({ ...value, options });
              }}
            />
            <label className="choice-correct-label">
              <input
                type="radio"
                name={`${id}-correct`}
                checked={value.correctIndex === index}
                onChange={() => onChange({ ...value, correctIndex: index })}
              />
              {letter} é a resposta correta
            </label>
          </div>
        ))}
      </fieldset>
      <TextField
        multiline
        label="Explicação (opcional)"
        value={value.explanation}
        onChange={(event) =>
          onChange({ ...value, explanation: event.target.value })
        }
        placeholder="Explique por que essa alternativa está correta. Aparece depois de responder."
      />
    </div>
  );
}
