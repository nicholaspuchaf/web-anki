import { BrandMark } from './BrandMark';
import { NavigationDrawer } from './NavigationDrawer';
import { SectionNavigation } from './SectionNavigation';
import type { AppPage } from './use-page';
import { useState, type ReactNode } from 'react';
import { ThemePicker } from '../features/theme/ThemePicker';

type Props = {
  online: boolean;
  page: AppPage;
  onHome: () => void;
  children: ReactNode;
};
export function AppLayout({ online, page, onHome, children }: Props) {
  const [menu, setMenu] = useState(false);
  return (
    <div className={`app${page === 'feed' ? ' app-feed' : ''}`}>
      <header className="app-header">
        <div className="header-navigation">
          <button
            className="app-menu-trigger brand"
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <BrandMark />
            <span>Folha</span>
          </button>
          <a
            className="brand desktop-brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onHome();
            }}
          >
            <BrandMark />
            <span>
              Folha<span className="brand-caption">LeetCode review</span>
            </span>
          </a>
          <button
            className="header-home"
            aria-label="Meus baralhos"
            onClick={onHome}
          >
            ▤ <span>Meus baralhos</span>
          </button>
        </div>
        <div className="header-tools">
          <span className="connection">
            <i />
            {!online
              ? 'Offline'
              : ['localhost', '127.0.0.1', '[::1]'].includes(
                    window.location.hostname,
                  ) || window.location.hostname.endsWith('.localhost')
                ? 'Local'
                : 'Online'}
          </span>
          <ThemePicker />
        </div>
      </header>
      <SectionNavigation page={page} className="app-section-nav" />
      {menu && (
        <NavigationDrawer
          title="Menu do aplicativo"
          onClose={() => setMenu(false)}
        >
          <SectionNavigation
            page={page}
            onClose={() => setMenu(false)}
            onHome={onHome}
          />
        </NavigationDrawer>
      )}
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
