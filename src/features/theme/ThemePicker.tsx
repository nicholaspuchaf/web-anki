import { useTheme, type ThemePreference } from './use-theme';
export function ThemePicker() {
  const { preference, changeTheme } = useTheme();
  return (
    <label className="theme-picker">
      <span aria-hidden="true">◐</span>
      <select
        aria-label="Tema"
        value={preference}
        onChange={(event) => changeTheme(event.target.value as ThemePreference)}
      >
        <option value="system">Automático</option>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>
    </label>
  );
}
