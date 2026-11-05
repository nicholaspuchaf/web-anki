import { useSyncExternalStore } from 'react';
export type AppPage = 'flashcards' | 'feed';
const subscribe = (notify: () => void) => {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
};
const currentPage = (): AppPage =>
  window.location.hash.split('?')[0] === '#/feed' ? 'feed' : 'flashcards';
export function usePage() {
  return useSyncExternalStore(
    subscribe,
    currentPage,
    (): AppPage => 'flashcards',
  );
}
