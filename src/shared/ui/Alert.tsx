import type { ReactNode } from 'react';

export function Alert({
  error = false,
  children,
  onDismiss,
}: {
  error?: boolean;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`alert${error ? ' error' : ''}`}
    >
      {children}
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Fechar aviso">
          ×
        </button>
      )}
    </div>
  );
}
