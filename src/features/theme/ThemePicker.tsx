import { useSyncExternalStore } from 'react';
import { useTheme } from './use-theme';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');
function subscribe(notify: () => void) {
  const query = media();
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
const systemIsDark = () => media().matches;
export function ThemePicker() {
  const { preference, changeTheme } = useTheme();
  const systemDark = useSyncExternalStore(subscribe, systemIsDark, () => false);
  const dark = preference === 'dark' || (preference === 'system' && systemDark);
  return (
    <button
      className="theme-picker"
      aria-label="Tema escuro"
      aria-pressed={dark}
      title={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onClick={() => changeTheme(dark ? 'light' : 'dark')}
    >
      <span aria-hidden="true">{dark ? '☾' : '☀'}</span>
    </button>
  );
}
