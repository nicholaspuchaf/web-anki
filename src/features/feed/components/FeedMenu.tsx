import { useEffect, useId, useRef } from 'react';
import { ThemePicker } from '../../theme/ThemePicker';

export function FeedMenu({
  onClose,
  onLearn,
  onManage,
  onCreate,
  onExport,
  onImport,
  ready,
  opening,
}: {
  ready: boolean;
  opening: boolean;
  onClose: () => void;
  onLearn: () => void;
  onManage: () => void;
  onCreate: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  function action(run: () => void) {
    onClose();
    run();
  }
  return (
    <dialog
      className="feed-menu"
      ref={ref}
      aria-labelledby={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="feed-menu-heading">
        <h2 id={title}>Menu do Feed</h2>
        <button aria-label="Fechar menu" onClick={onClose}>
          ×
        </button>
      </div>
      <nav aria-label="Seções do aplicativo">
        <a href="#/" onClick={onClose}>
          ▤ Flashcards
        </a>
        <a href="#/feed" aria-current="page" onClick={() => action(onLearn)}>
          ✦ Feed
        </a>
        <a href="#/admin" onClick={onClose}>
          ▥ Administração
        </a>
      </nav>
      <div className="feed-menu-actions">
        <button onClick={() => action(onLearn)}>Aprender</button>
        <button onClick={() => action(onManage)}>Meus carrosséis</button>
        <button disabled={!ready || opening} onClick={() => action(onCreate)}>
          + Novo carrossel
        </button>
      </div>
      <div className="feed-menu-actions">
        <button disabled={!ready} onClick={() => action(onExport)}>
          Exportar Feed
        </button>
        <button disabled={!ready} onClick={() => action(onImport)}>
          Importar Feed
        </button>
      </div>
      <div className="feed-menu-theme">
        <span>Aparência</span>
        <ThemePicker />
      </div>
    </dialog>
  );
}
