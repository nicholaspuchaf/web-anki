import { useMemo, useSyncExternalStore } from 'react';
import { parseDisabledDecks, SETTINGS_KEY } from './model';

const eventName = 'folha:settings-changed';
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY || event.key === null) notify();
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
    return localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
}
export function useSettings() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const disabledDecks = useMemo(() => parseDisabledDecks(raw), [raw]);
  function setDeckEnabled(id: string, enabled: boolean) {
    // Read again so separate tabs do not overwrite unrelated recent choices.
    const current = parseDisabledDecks(localStorage.getItem(SETTINGS_KEY));
    const next = enabled
      ? current.filter((item) => item !== id)
      : [...current, id];
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(parseDisabledDecks(JSON.stringify(next))),
    );
    window.dispatchEvent(new Event(eventName));
  }
  return { disabledDecks, setDeckEnabled };
}
