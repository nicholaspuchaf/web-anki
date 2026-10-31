import { useId, type SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
};
export function SelectField({
  label,
  options,
  id: suppliedId,
  ...props
}: Props) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select {...props} id={id}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
