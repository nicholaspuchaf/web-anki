import type { FeedSlide } from '../model';

export function SlideContent({
  slide,
  onImageLoaded,
}: {
  slide: FeedSlide;
  onImageLoaded?: (id: string) => void;
}) {
  return (
    <div className="feed-slide-content">
      <h3>{slide.title || 'Título do card'}</h3>
      {slide.blocks.map((block, index) => {
        if (block.type === 'paragraph')
          return (
            <div
              className="feed-paragraph"
              key={block.id}
              data-step={index + 1}
            >
              {block.text.split(/\n\s*\n/).map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          );
        if (block.type === 'code')
          return (
            <div className="feed-code" key={block.id}>
              <span>{block.language}</span>
              <pre tabIndex={0} aria-label={`Código em ${block.language}`}>
                <code>{block.text}</code>
              </pre>
            </div>
          );
        if (block.type === 'bullets')
          return (
            <ul key={block.id} data-step={index + 1}>
              {block.items
                .filter((item) => item.trim())
                .map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
            </ul>
          );
        return (
          <figure key={block.id}>
            <a
              href={block.src}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ampliar: ${block.alt || 'imagem do card'}`}
            >
              <img
                src={block.src}
                alt={block.alt}
                loading="lazy"
                decoding="async"
                onLoad={() => onImageLoaded?.(block.id)}
              />
            </a>
            {(block.caption || block.credit) && (
              <figcaption>
                {block.caption}
                {block.credit &&
                  (block.sourceUrl ? (
                    <a href={block.sourceUrl} target="_blank" rel="noreferrer">
                      {block.credit} ↗
                    </a>
                  ) : (
                    <span>{block.credit}</span>
                  ))}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
