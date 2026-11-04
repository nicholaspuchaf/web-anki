import type { StudyImage } from './image';

export function StudyIllustration({ image }: { image: StudyImage }) {
  return (
    <figure className="study-illustration">
      <a
        href={image.src}
        target="_blank"
        rel="noreferrer"
        aria-label={`Ampliar imagem: ${image.alt}`}
      >
        <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
      </a>
      <figcaption>
        {image.caption && <span>{image.caption}</span>}
        {image.sourceUrl ? (
          <a href={image.sourceUrl} target="_blank" rel="noreferrer">
            {image.credit} ↗
          </a>
        ) : (
          <span>{image.credit}</span>
        )}
      </figcaption>
    </figure>
  );
}
