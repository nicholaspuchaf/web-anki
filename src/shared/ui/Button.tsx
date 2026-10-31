import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'text' | 'light' | 'default';
};

export function Button({
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: Props) {
  const variantClass =
    variant === 'default' ? '' : variant === 'text' ? 'text-button' : variant;
  return (
    <button
      {...props}
      type={type}
      className={`${variantClass} ${className}`.trim()}
    />
  );
}
