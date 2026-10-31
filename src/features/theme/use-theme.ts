import { useEffect, useState } from 'react';
export type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'folha-theme';
function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}
export function applyTheme(preference: ThemePreference) {
  const dark =
    preference === 'dark' ||
    (preference === 'system' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#1a1a1a' : '#ffffff');
}
export function initializeTheme() {
  applyTheme(readPreference());
}
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  useEffect(() => {
    applyTheme(preference);
    const media = matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => applyTheme(preference);
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        setPreference(readPreference());
    };
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [preference]);
  function changeTheme(value: ThemePreference) {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* Theme still works when storage is unavailable. */
    }
    applyTheme(value);
    setPreference(value);
  }
  return { preference, changeTheme };
}
