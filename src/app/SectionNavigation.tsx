import type { AppPage } from './use-page';

const sections = [
  { page: 'flashcards', href: '#/', icon: '▤', label: 'Flashcards' },
  { page: 'feed', href: '#/feed', icon: '✦', label: 'Feed' },
  { page: 'admin', href: '#/admin', icon: '▥', label: 'Administração' },
  { page: 'settings', href: '#/settings', icon: '⚙', label: 'Configurações' },
] as const;
export function SectionNavigation({
  page,
  className,
  onClose,
  onHome,
  onFeed,
}: {
  page: AppPage;
  className?: string;
  onClose?: () => void;
  onHome?: () => void;
  onFeed?: () => void;
}) {
  return (
    <nav className={className} aria-label="Seções do aplicativo">
      {sections.map((section) => (
        <a
          key={section.page}
          href={section.href}
          aria-current={page === section.page ? 'page' : undefined}
          onClick={(event) => {
            onClose?.();
            if (section.page === 'flashcards' && onHome) {
              event.preventDefault();
              onHome();
            }
            if (section.page === 'feed') onFeed?.();
          }}
        >
          <span aria-hidden="true">{section.icon}</span>
          <span>{section.label}</span>
        </a>
      ))}
    </nav>
  );
}
