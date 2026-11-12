import type { Card } from '../library/model';

export const STUDY_PREFERENCES_KEY = 'folha:study-preferences:v1';
export type StudyPreferences = { dailyGoal: number; spacingMultiplier: number };
export const DEFAULT_STUDY_PREFERENCES: StudyPreferences = {
  dailyGoal: 20,
  spacingMultiplier: 1,
};
export function validSpacing(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 4 &&
    Number.isInteger(value * 4)
  );
}
export function parseStudyPreferences(raw: string | null): StudyPreferences {
  try {
    const input: unknown = JSON.parse(raw ?? 'null');
    const value =
      input && typeof input === 'object'
        ? (input as Partial<StudyPreferences>)
        : {};
    return {
      dailyGoal:
        Number.isInteger(value.dailyGoal) &&
        value.dailyGoal! >= 1 &&
        value.dailyGoal! <= 200
          ? value.dailyGoal!
          : DEFAULT_STUDY_PREFERENCES.dailyGoal,
      spacingMultiplier: validSpacing(value.spacingMultiplier)
        ? value.spacingMultiplier
        : DEFAULT_STUDY_PREFERENCES.spacingMultiplier,
    };
  } catch {
    return { ...DEFAULT_STUDY_PREFERENCES };
  }
}
export function studyMilestones(cards: readonly Card[], dailyGoal: number) {
  if (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 200)
    throw new Error('A meta deve ser de 1 a 200 cartões por dia.');
  return [1, 2, 3].map((passes) => ({
    passes,
    reviews: cards.length * passes,
    days: Math.ceil((cards.length * passes) / dailyGoal),
  }));
}
