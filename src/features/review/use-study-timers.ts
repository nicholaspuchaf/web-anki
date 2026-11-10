import { useEffect, useState } from 'react';
import { advanceStudyTime, type StudyTime } from './study-timer';

export function useStudyTimers(
  session: number,
  cardId: string | undefined,
  active: boolean,
) {
  const [elapsed, setElapsed] = useState<StudyTime>({
    session: 0,
    totalMs: 0,
    cardMs: 0,
  });
  useEffect(() => {
    if (!active || !cardId) return;
    let previous = performance.now();
    let counting = document.visibilityState !== 'hidden';
    const tick = () => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (counting && delta > 0)
        setElapsed((value) => advanceStudyTime(value, session, cardId, delta));
    };
    const visibility = () => {
      tick();
      counting = document.visibilityState !== 'hidden';
    };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      tick();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [session, cardId, active]);
  return {
    totalMs: elapsed.session === session ? elapsed.totalMs : 0,
    cardMs:
      elapsed.session === session && elapsed.cardId === cardId
        ? elapsed.cardMs
        : 0,
  };
}
