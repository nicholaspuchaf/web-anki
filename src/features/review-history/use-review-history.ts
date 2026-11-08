import { useEffect, useState } from 'react';
import type { Library } from '../library/model';
import {
  readReviewHistory,
  HISTORY_CHANGED,
  HISTORY_LOCAL_PREFIX,
} from '../../shared/storage/review-history-repository';
import { emptyHistory, type ReviewHistory } from './model';

export function useReviewHistory(library: Library) {
  const [data, setData] = useState<ReviewHistory & { library?: Library }>({
    meta: emptyHistory(),
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true,
      generation = 0;
    const load = () => {
      const current = ++generation;
      void readReviewHistory()
        .then((snapshot) => {
          if (active && current === generation) {
            setData(snapshot);
            setLoading(false);
            setError('');
          }
        })
        .catch(() => {
          if (active && current === generation) {
            setLoading(false);
            setError(
              'Não foi possível abrir o histórico. Seu progresso não foi alterado.',
            );
          }
        });
    };
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(HISTORY_LOCAL_PREFIX))
        load();
    };
    load();
    window.addEventListener(HISTORY_CHANGED, load);
    window.addEventListener('focus', load);
    window.addEventListener('storage', storage);
    return () => {
      active = false;
      window.removeEventListener(HISTORY_CHANGED, load);
      window.removeEventListener('focus', load);
      window.removeEventListener('storage', storage);
    };
  }, [library, refresh]);
  return { data, loading, error, reload: () => setRefresh((n) => n + 1) };
}
