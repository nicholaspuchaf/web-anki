export type StudyTime = {
  session: number;
  cardId?: string;
  totalMs: number;
  cardMs: number;
};
export function advanceStudyTime(
  previous: StudyTime,
  session: number,
  cardId: string,
  deltaMs: number,
): StudyTime {
  const delta = Math.max(0, deltaMs);
  const sameSession = previous.session === session;
  return {
    session,
    cardId,
    totalMs: (sameSession ? previous.totalMs : 0) + delta,
    cardMs:
      (sameSession && previous.cardId === cardId ? previous.cardMs : 0) + delta,
  };
}
export function formatStudyTime(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
