import { NavigationDrawer } from '../../../app/NavigationDrawer';
import { SectionNavigation } from '../../../app/SectionNavigation';
import { ThemePicker } from '../../theme/ThemePicker';

export function FeedMenu({
  onHome,
  onClose,
  onLearn,
  onManage,
  onCreate,
  onExport,
  onImport,
  ready,
  opening,
  canCreate = true,
}: {
  onHome: () => void;
  ready: boolean;
  opening: boolean;
  canCreate?: boolean;
  onClose: () => void;
  onLearn: () => void;
  onManage: () => void;
  onCreate: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  function action(run: () => void) {
    onClose();
    run();
  }
  return (
    <NavigationDrawer title="Menu do Feed" onClose={onClose}>
      <SectionNavigation
        page="feed"
        onHome={onHome}
        onClose={onClose}
        onFeed={onLearn}
      />
      <div className="feed-menu-actions">
        <button onClick={() => action(onLearn)}>Aprender</button>
        <button onClick={() => action(onManage)}>Meus carrosséis</button>
        <button
          disabled={!ready || opening || !canCreate}
          onClick={() => action(onCreate)}
        >
          + Novo carrossel
        </button>
      </div>
      <div className="feed-menu-actions">
        <button disabled={!ready} onClick={() => action(onExport)}>
          Exportar Feed
        </button>
        <button disabled={!ready} onClick={() => action(onImport)}>
          Importar Feed
        </button>
      </div>
      <div className="feed-menu-theme">
        <span>Aparência</span>
        <ThemePicker />
      </div>
    </NavigationDrawer>
  );
}
