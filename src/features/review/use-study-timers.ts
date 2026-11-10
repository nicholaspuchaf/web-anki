import { recordStudySpan, type StudyVisit } from '../study-time/repository';
import { useEffect, useRef, useState } from 'react';
import { advanceStudyTime, type StudyTime } from './study-timer';

export function useStudyTimers(
  session: number,
  cardId: string | undefined,
  active: boolean,
  deckId: string | undefined,
  practice: boolean,
) {
  const [elapsed, setElapsed] = useState<StudyTime>({
    session: 0,
    totalMs: 0,
    cardMs: 0,
  });
  const [storageWarning, setStorageWarning] = useState('');
  const visit = useRef<(StudyVisit & { session: number }) | null>(null);
  useEffect(() => {
    if (!active || !cardId || !deckId) return;
    if (
      !visit.current ||
      visit.current.session !== session ||
      visit.current.cardId !== cardId ||
      visit.current.deckId !== deckId
    ) {
      visit.current = {
        id: crypto.randomUUID(),
        session,
        cardId,
        deckId,
        practice,
        days: new Map(),
      };
    }
    const currentVisit = visit.current;
    let previous = performance.now();
    let counting = document.visibilityState !== 'hidden';
    const tick = () => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (counting && delta > 0) {
        setElapsed((value) => advanceStudyTime(value, session, cardId, delta));
        setStorageWarning(recordStudySpan(currentVisit, delta) ?? '');
      }
    };
    const visibility = () => {
      tick();
      counting = document.visibilityState !== 'hidden';
    };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', visibility);
    const hide = () => {
      tick();
      counting = false;
    };
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', visibility);
    return () => {
      tick();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', visibility);
    };
  }, [session, cardId, active, deckId, practice]);
  return {
    storageWarning,
    totalMs: elapsed.session === session ? elapsed.totalMs : 0,
    cardMs:
      elapsed.session === session && elapsed.cardId === cardId
        ? elapsed.cardMs
        : 0,
  };
}
