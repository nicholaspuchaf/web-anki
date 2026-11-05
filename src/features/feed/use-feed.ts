import { useEffect, useState } from 'react';
import { emptyFeed, type FeedData } from './model';
import { loadFeed } from './repository';

export function useFeed() {
  const [data, setData] = useState<FeedData>(emptyFeed);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const reload = () =>
      loadFeed()
        .then((next) => {
          if (active) {
            setData(next);
            setReady(true);
          }
        })
        .catch(() => {
          if (active)
            setError(
              'Não foi possível abrir o Feed. Seus dados foram preservados.',
            );
        });
    void reload();
    window.addEventListener('focus', reload);
    return () => {
      active = false;
      window.removeEventListener('focus', reload);
    };
  }, []);
  async function perform(operation: () => Promise<FeedData>): Promise<boolean> {
    try {
      const next = await operation();
      setData(next);
      setError('');
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar o Feed. Tente novamente.',
      );
      return false;
    }
  }
  return { data, ready, error, setError, setData, perform };
}
