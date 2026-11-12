import { useMemo, useSyncExternalStore } from 'react';
import {
  parseStudyPreferences,
  STUDY_PREFERENCES_KEY,
  type StudyPreferences,
} from './study-plan';

const eventName = 'folha:study-preferences-changed';
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === STUDY_PREFERENCES_KEY || event.key === null) notify();
  };
  window.addEventListener('storage', storage);
  window.addEventListener(eventName, notify);
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener(eventName, notify);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(STUDY_PREFERENCES_KEY);
  } catch {
    return null;
  }
}
export function useStudyPreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const preferences = useMemo(() => parseStudyPreferences(raw), [raw]);
  function updatePreferences(patch: Partial<StudyPreferences>) {
    const current = parseStudyPreferences(
      localStorage.getItem(STUDY_PREFERENCES_KEY),
    );
    const next = parseStudyPreferences(
      JSON.stringify({ ...current, ...patch }),
    );
    localStorage.setItem(STUDY_PREFERENCES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(eventName));
  }
  return { preferences, updatePreferences };
}
