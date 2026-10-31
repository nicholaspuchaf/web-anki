import type { ReactNode } from 'react';
import { ThemePicker } from '../features/theme/ThemePicker';

type Props = { online: boolean; onHome: () => void; children: ReactNode };
export function AppLayout({ online, onHome, children }: Props) {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-navigation">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onHome();
            }}
          >
            <span className="brand-icon" aria-hidden="true">
              〈<b>/</b>〉
            </span>
            <span>
              Folha<span className="brand-caption">LeetCode review</span>
            </span>
          </a>
          <button className="header-home" onClick={onHome}>
            ▤ <span>Meus baralhos</span>
          </button>
        </div>
        <div className="header-tools">
          <span className="connection">
            <i />
            {online ? 'Local' : 'Offline'}
          </span>
          <ThemePicker />
        </div>
      </header>
      {children}
      <footer>
        <span>
          Folha <span>·</span> Sua biblioteca de problemas resolvidos.
        </span>
        <span>Armazenamento local · disponível offline</span>
      </footer>
    </div>
  );
}
