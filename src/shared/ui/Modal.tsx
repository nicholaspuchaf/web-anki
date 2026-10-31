import { useEffect, useId, useRef, type ReactNode } from 'react';

type Props = {
  title: string;
  wide?: boolean;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({
  title,
  wide = false,
  busy = false,
  onClose,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className={wide ? 'modal-wide' : undefined}
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="section-title">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          aria-label="Fechar"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
