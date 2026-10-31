import { useState } from 'react';
export function TagList({
  tags,
  onSelect,
}: {
  tags: string[];
  onSelect?: (tag: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  if (!tags.length) return null;
  return (
    <div className="tag-disclosure">
      <button
        className="tag-toggle"
        aria-expanded={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? 'Ocultar tags' : `Mostrar tags (${tags.length})`}
      </button>
      {visible && (
        <div className="tag-list">
          {tags.map((tag) =>
            onSelect ? (
              <button key={tag} className="tag" onClick={() => onSelect(tag)}>
                {tag}
              </button>
            ) : (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
