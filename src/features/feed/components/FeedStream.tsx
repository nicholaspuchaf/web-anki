import { useEffect, useRef, useState } from 'react';
import {
  appendFeedSession,
  startFeedSession,
  type Carousel,
  type FeedData,
} from '../model';
import { carouselGesture, type FeedGesture } from '../gesture';
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
  const [session, setSession] = useState(() => ({
    ...startFeedSession(data, now),
    position: 0,
  }));
  const stream = useRef<HTMLDivElement>(null);
  const gesture = useRef<FeedGesture | null>(null);
  const offsets = useRef(new Map<number, number>());
  const activeKey = session.items[session.position]?.key;
  function jump(delta: number) {
    if (paused) return;
    if (stream.current && activeKey !== undefined)
      offsets.current.set(activeKey, stream.current.scrollTop);
    setSession((current) => {
      const position = Math.max(0, current.position + delta);
      if (position === current.position) return current;
      const next =
        position >= current.items.length
          ? appendFeedSession(current, data)
          : current;
      return { ...next, position };
    });
  }
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      stream.current?.scrollTo({
        top:
          activeKey !== undefined ? (offsets.current.get(activeKey) ?? 0) : 0,
        behavior: 'instant',
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [activeKey]);
  return (
    <div className="feed-stream-shell">
      <div
        className="feed-stream"
        ref={stream}
        role="region"
        aria-label="Feed de aprendizado"
        tabIndex={0}
        onScroll={() => {
          if (stream.current && activeKey !== undefined)
            offsets.current.set(activeKey, stream.current.scrollTop);
        }}
        onTouchStart={(event) => {
          const root = stream.current;
          if (!root || paused || event.touches.length !== 1) {
            gesture.current = null;
            return;
          }
          const touch = event.touches[0];
          gesture.current = {
            x: touch.clientX,
            y: touch.clientY,
            atTop: root.scrollTop <= 2,
            atBottom:
              root.scrollHeight - root.clientHeight - root.scrollTop <= 2,
          };
        }}
        onTouchCancel={() => {
          gesture.current = null;
        }}
        onTouchEnd={(event) => {
          const start = gesture.current;
          gesture.current = null;
          const touch = event.changedTouches[0];
          if (!start || !touch || paused) return;
          const direction = carouselGesture(
            start,
            { x: touch.clientX, y: touch.clientY },
            window.matchMedia('(max-width: 760px)').matches,
          );
          if (direction) jump(direction);
        }}
      >
        {session.items.map((item, index) => {
          const carousel = data.carousels.find((c) => c.id === item.carouselId);
          if (!carousel) return null;
          return (
            <div
              className="feed-entry"
              key={item.key}
              hidden={index !== session.position}
              inert={index !== session.position}
            >
              <LearningCarousel
                carousel={carousel}
                progress={data.progress.find(
                  (p) => p.carouselId === carousel.id,
                )}
                now={now}
                paused={paused || index !== session.position}
                onRead={(id) => onRead(carousel, id)}
              />
            </div>
          );
        })}
      </div>
      <nav
        className="feed-vertical-controls"
        aria-label="Navegação entre carrosséis"
      >
        <button
          aria-label="Carrossel anterior"
          title="Carrossel anterior"
          disabled={session.position === 0 || paused}
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
