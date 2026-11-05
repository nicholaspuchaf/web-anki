import { useEffect, useRef, useState } from 'react';
import type { Carousel, FeedProgress } from '../model';
import { SlideContent } from './SlideContent';

function ReadMarker({
  enabled,
  onRead,
}: {
  enabled: boolean;
  onRead: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    let visible = false;
    let timer: number | undefined;
    const clear = () => {
      window.clearTimeout(timer);
    };
    const schedule = () => {
      clear();
      if (visible && document.visibilityState === 'visible')
        timer = window.setTimeout(onRead, 1500);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.8;
        schedule();
      },
      { threshold: [0, 0.8, 1] },
    );
    observer.observe(ref.current);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      clear();
      observer.disconnect();
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [enabled, onRead]);
  return <div className="feed-read-marker" ref={ref} aria-hidden="true" />;
}

export function LearningCarousel({
  carousel,
  progress,
  now,
  preview = false,
  paused = false,
  onRead,
}: {
  carousel: Carousel;
  progress?: FeedProgress;
  now: number;
  preview?: boolean;
  paused?: boolean;
  onRead?: (slideId: string) => void;
}) {
  const [active, setActive] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const track = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const slides = useRef<(HTMLDivElement | null)[]>([]);
  const scheduled =
    progress?.nextDueAt !== null &&
    progress?.nextDueAt !== undefined &&
    progress.nextDueAt > now;
  const seen =
    scheduled || progress?.nextDueAt ? [] : (progress?.seenSlideIds ?? []);
  useEffect(() => {
    const slide = slides.current[active];
    if (!slide) return;
    const observer = new ResizeObserver(() =>
      setHeight(slide.getBoundingClientRect().height),
    );
    observer.observe(slide);
    return () => observer.disconnect();
  }, [active, carousel.revision]);
  function go(index: number) {
    const element = track.current;
    if (element)
      element.scrollTo({
        left: index * element.clientWidth,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }
  return (
    <article
      className={`learning-carousel${preview ? ' carousel-preview' : ''}`}
      aria-label={carousel.title || 'Prévia do carrossel'}
    >
      <div
        className="feed-slide-track"
        style={height ? { height } : undefined}
        ref={track}
        role="region"
        aria-label="Cards do carrossel"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            go(
              Math.max(
                0,
                Math.min(
                  carousel.slides.length - 1,
                  active + (event.key === 'ArrowRight' ? 1 : -1),
                ),
              ),
            );
          }
        }}
        onScroll={() => {
          const el = track.current;
          if (el) {
            const index = Math.round(el.scrollLeft / el.clientWidth);
            setActive(Math.max(0, Math.min(carousel.slides.length - 1, index)));
          }
        }}
      >
        {carousel.slides.map((slide, index) => (
          <div
            className="feed-slide"
            key={slide.id}
            ref={(element) => {
              slides.current[index] = element;
            }}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            <div className="feed-slide-number">
              <span>
                {index + 1} / {carousel.slides.length}
              </span>
            </div>
            <SlideContent
              slide={slide}
              onImageLoaded={(id) =>
                setLoadedImages((current) =>
                  current.includes(id) ? current : [...current, id],
                )
              }
            />
            <ReadMarker
              enabled={
                !preview &&
                !paused &&
                index === active &&
                !scheduled &&
                !seen.includes(slide.id) &&
                slide.blocks.every(
                  (block) =>
                    block.type !== 'image' || loadedImages.includes(block.id),
                )
              }
              onRead={() => onRead?.(slide.id)}
            />
          </div>
        ))}
      </div>
      <nav className="feed-carousel-nav" aria-label="Navegação do carrossel">
        <button
          aria-label="Card anterior"
          disabled={active === 0}
          onClick={() => go(active - 1)}
        >
          ←
        </button>
        <div className="feed-dots">
          {carousel.slides.map((slide, index) => (
            <button
              key={slide.id}
              className={index === active ? 'active' : ''}
              aria-label={`Ir para o card ${index + 1}`}
              aria-current={index === active ? 'step' : undefined}
              onClick={() => go(index)}
            />
          ))}
        </div>
        <button
          aria-label="Próximo card"
          disabled={active === carousel.slides.length - 1}
          onClick={() => go(active + 1)}
        >
          →
        </button>
      </nav>
      <footer className="feed-post-footer">
        <div className="feed-tag-list">
          {carousel.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        {!preview && (
          <p className="feed-progress" role="status">
            {scheduled
              ? `✓ Carrossel concluído · volta em ${new Date(progress!.nextDueAt!).toLocaleDateString('pt-BR')}`
              : `${seen.length} de ${carousel.slides.length} cards lidos · reaparece após ${carousel.intervalDays} dia(s)`}
          </p>
        )}
      </footer>
    </article>
  );
}
