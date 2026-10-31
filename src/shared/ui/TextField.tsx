import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type Props = { label: string } & (
  | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
  | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)
);

export function TextField(props: Props) {
  const generatedId = useId();
  const { label, ...rest } = props;
  const id = props.id ?? generatedId;
  if (rest.multiline) {
    const { multiline: _, ...attributes } = rest;
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <textarea {...attributes} id={id} />
      </div>
    );
  }
  const { multiline: _, ...attributes } = rest;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input {...attributes} id={id} />
    </div>
  );
}
