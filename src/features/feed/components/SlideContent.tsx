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
      {slide.blocks.map((block) => {
        if (block.type === 'paragraph')
          return (
            <div className="feed-paragraph" key={block.id}>
              {block.text.split(/\n\s*\n/).map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          );
        if (block.type === 'bullets')
          return (
            <ul key={block.id}>
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
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}
