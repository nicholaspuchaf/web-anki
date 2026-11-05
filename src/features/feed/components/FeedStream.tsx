import { useEffect, useRef, useState } from 'react';
import {
  appendFeedSession,
  startFeedSession,
  type Carousel,
  type FeedData,
} from '../model';
import { LearningCarousel } from './LearningCarousel';

export function FeedStream({
  data,
  now,
  onRead,
  paused = false,
}: {
  data: FeedData;
  now: number;
  paused?: boolean;
  onRead: (carousel: Carousel, slideId: string) => void;
}) {
  const [session, setSession] = useState(() => startFeedSession(data, now));
  const [position, setPosition] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const stream = useRef<HTMLDivElement>(null);
  const pendingJump = useRef<number | null>(null);
  function scrollToPost(index: number) {
    const root = stream.current;
    const target = root?.querySelectorAll<HTMLElement>(
      ':scope > .learning-carousel',
    )[index];
    if (root && target)
      root.scrollTo({
        top:
          root.scrollTop +
          target.getBoundingClientRect().top -
          root.getBoundingClientRect().top,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }
  function jump(delta: number) {
    const next = Math.max(0, position + delta);
    if (next >= session.items.length) {
      pendingJump.current = next;
      setSession((current) => appendFeedSession(current, data));
    } else scrollToPost(next);
  }
  useEffect(() => {
    if (pendingJump.current === null) return;
    const index = pendingJump.current;
    pendingJump.current = null;
    const timer = requestAnimationFrame(() => scrollToPost(index));
    return () => cancelAnimationFrame(timer);
  }, [session.items.length]);
  useEffect(() => {
    if (!sentinel.current || paused) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setSession((current) => appendFeedSession(current, data));
      },
      { root: stream.current, rootMargin: '160px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [data, session.items.length, paused]);
  return (
    <div className="feed-stream-shell">
      <div
        className="feed-stream"
        ref={stream}
        role="region"
        aria-label="Feed de aprendizado"
        tabIndex={0}
        onScroll={() => {
          const root = stream.current;
          if (!root) return;
          const top = root.getBoundingClientRect().top;
          const posts = [
            ...root.querySelectorAll<HTMLElement>(
              ':scope > .learning-carousel',
            ),
          ];
          const index = posts.findIndex(
            (post) => post.getBoundingClientRect().bottom > top + 80,
          );
          if (index >= 0) setPosition(index);
        }}
      >
        {session.items.map((item) => {
          const carousel = data.carousels.find((c) => c.id === item.carouselId);
          if (!carousel) return null;
          return (
            <LearningCarousel
              key={item.key}
              carousel={carousel}
              progress={data.progress.find((p) => p.carouselId === carousel.id)}
              now={now}
              paused={paused}
              onRead={(id) => onRead(carousel, id)}
            />
          );
        })}
        <div ref={sentinel} className="feed-load-more">
          <p>
            {session.pending.length
              ? 'Continue para o próximo tema.'
              : 'Você pode continuar com releituras. Seu agendamento será mantido.'}
          </p>
          <button
            onClick={() =>
              setSession((current) => appendFeedSession(current, data))
            }
          >
            Mostrar outro carrossel ↓
          </button>
        </div>
      </div>
      <nav
        className="feed-vertical-controls"
        aria-label="Navegação entre carrosséis"
      >
        <button
          aria-label="Carrossel anterior"
          title="Carrossel anterior"
          disabled={position === 0 || paused}
          onClick={() => jump(-1)}
        >
          ↑
        </button>
        <button
          aria-label="Próximo carrossel"
          title="Próximo carrossel"
          disabled={paused}
          onClick={() => jump(1)}
        >
          ↓
        </button>
      </nav>
    </div>
  );
}
