import { useSyncExternalStore } from 'react';
export type AppPage = 'flashcards' | 'feed' | 'admin' | 'settings';
const subscribe = (notify: () => void) => {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
};
const currentPage = (): AppPage => {
  const path = window.location.hash.split('?')[0];
  return path === '#/feed'
    ? 'feed'
    : path === '#/admin'
      ? 'admin'
      : path === '#/settings'
        ? 'settings'
        : 'flashcards';
};
export function usePage() {
  return useSyncExternalStore(
    subscribe,
    currentPage,
    (): AppPage => 'flashcards',
  );
}
