import type { AppPage } from './use-page';
import type { ReactNode } from 'react';
import { ThemePicker } from '../features/theme/ThemePicker';

type Props = {
  online: boolean;
  page: AppPage;
  onHome: () => void;
  children: ReactNode;
};
export function AppLayout({ online, page, onHome, children }: Props) {
  return (
    <div className={`app${page === 'feed' ? ' app-feed' : ''}`}>
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
      <nav className="app-section-nav" aria-label="Seções do aplicativo">
        <a href="#/" aria-current={page === 'flashcards' ? 'page' : undefined}>
          ▤ <span>Flashcards</span>
        </a>
        <a href="#/feed" aria-current={page === 'feed' ? 'page' : undefined}>
          ✦ <span>Feed</span>
        </a>
      </nav>
      {children}
      {page !== 'feed' && (
        <footer>
          <span>
            Folha <span>·</span> Aprenda com profundidade. Revise no seu ritmo.
          </span>
          <span>Armazenamento local · disponível offline</span>
        </footer>
      )}
    </div>
  );
}
