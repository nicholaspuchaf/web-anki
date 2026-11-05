import type { CSSProperties } from 'react';
import { carouselTemplates, type CarouselTemplate } from '../presentation';

export function TemplatePicker({
  value,
  onChange,
}: {
  value: CarouselTemplate;
  onChange: (value: CarouselTemplate) => void;
}) {
  const selected = carouselTemplates.find((t) => t.id === value)!;
  return (
    <div
      className="feed-template-picker"
      role="group"
      aria-label="Template visual do carrossel"
    >
      <p>Template visual</p>
      <div className="feed-template-options">
        {carouselTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            aria-pressed={value === template.id}
            onClick={() => onChange(template.id)}
            style={{ '--swatch': template.color } as CSSProperties}
          >
            <span
              aria-hidden="true"
              className={`feed-template-swatch swatch-${template.id}`}
            >
              <i />
              <i />
              <i />
            </span>
            <span>{template.name}</span>
          </button>
        ))}
      </div>
      <small>
        {selected.description} Os cards alternam estilos automaticamente.
      </small>
    </div>
  );
}
