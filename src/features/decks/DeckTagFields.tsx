import { useState } from 'react';
import { SelectField } from '../../shared/ui/SelectField';
import { TextField } from '../../shared/ui/TextField';
import { deckTagPolicy, enforceDeckTags } from './tag-policy';

export function DeckTagFields({
  deckId,
  tags,
  onChange,
}: {
  deckId: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const policy = deckTagPolicy(deckId);
  const [extraText, setExtraText] = useState(() =>
    tags
      .filter(
        (tag) =>
          !policy?.required.includes(tag.toLowerCase()) &&
          !policy?.oneOf.includes(tag.toLowerCase()),
      )
      .join(', '),
  );
  if (!policy) return null;
  const normalized = tags.map((tag) => tag.trim().toLowerCase());
  const assessment =
    policy.oneOf.find((tag) => normalized.includes(tag)) ?? policy.default;
  const current = enforceDeckTags(deckId, [
    ...normalized.filter((tag) => !policy.oneOf.includes(tag)),
    assessment,
  ]);
  return (
    <div className="deck-tag-fields">
      <p>
        Tags obrigatórias: <strong>{policy.required.join(' · ')}</strong>
      </p>
      <SelectField
        label="Avaliação"
        value={assessment}
        options={policy.oneOf.map((tag) => ({
          value: tag,
          label: tag.toUpperCase(),
        }))}
        onChange={(event) => {
          onChange(
            enforceDeckTags(deckId, [
              ...current.filter((tag) => !policy.oneOf.includes(tag)),
              event.target.value,
            ]),
          );
        }}
      />
      <TextField
        label="Tags adicionais (separadas por vírgula)"
        value={extraText}
        onChange={(event) => {
          setExtraText(event.target.value);
          onChange(
            enforceDeckTags(deckId, [
              assessment,
              ...event.target.value
                .split(',')
                .filter(
                  (tag) => !policy.oneOf.includes(tag.trim().toLowerCase()),
                ),
            ]),
          );
        }}
      />
    </div>
  );
}
