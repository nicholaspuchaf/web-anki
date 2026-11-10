import { splitStudySpan, validStudyRecord, type StudyRecord } from './model';
export const STUDY_PREFIX = 'folha:study-time:v1:';
export const STUDY_CHANGED = 'folha:study-time-changed';
export type StudyVisit = {
  id: string;
  cardId: string;
  deckId: string;
  practice: boolean;
  days: Map<string, StudyRecord>;
};
const pending = new Map<string, StudyRecord>();
let warning = '';
/** One key per visit/day: retries overwrite a checkpoint, and tabs use distinct UUIDs. */
export function recordStudySpan(
  visit: StudyVisit,
  durationMs: number,
  endedAt = Date.now(),
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  if (
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    !Number.isFinite(endedAt)
  )
    return;
  for (const part of splitStudySpan(endedAt, durationMs)) {
    const previous = visit.days.get(part.day);
    const row: StudyRecord = {
      id: visit.id,
      cardId: visit.cardId,
      deckId: visit.deckId,
      practice: visit.practice,
      day: part.day,
      durationMs: (previous?.durationMs ?? 0) + part.durationMs,
      lastStudiedAt: endedAt,
    };
    visit.days.set(part.day, row);
    pending.set(`${STUDY_PREFIX}${visit.id}:${part.day}`, row);
  }
  try {
    for (const [key, row] of pending) {
      storage.setItem(key, JSON.stringify(row));
      pending.delete(key);
    }
    warning = '';
  } catch {
    warning =
      'Não foi possível salvar todo o tempo de estudo. Há registros apenas na memória desta aba; libere espaço antes de fechá-la.';
  }
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(STUDY_CHANGED));
  return warning;
}
export function readStudyTime(
  storage: Pick<Storage, 'getItem' | 'key' | 'length'> = localStorage,
): { records: StudyRecord[]; warning: string } {
  const rows = new Map<string, StudyRecord>();
  let message = warning;
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(STUDY_PREFIX)) continue;
      try {
        const row: unknown = JSON.parse(storage.getItem(key) ?? 'null');
        if (
          !validStudyRecord(row) ||
          key !== `${STUDY_PREFIX}${row.id}:${row.day}`
        )
          throw new Error('Registro inválido');
        rows.set(key, row);
      } catch {
        message ||=
          'Alguns registros de tempo inválidos foram ignorados. Seu histórico de revisões não foi alterado.';
      }
    }
  } catch {
    message ||= 'Não foi possível ler os tempos salvos neste navegador.';
  }
  for (const [key, row] of pending) rows.set(key, row);
  return { records: [...rows.values()], warning: message };
}
