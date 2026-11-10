import { useEffect, useState } from 'react';
import { readStudyTime, STUDY_CHANGED, STUDY_PREFIX } from './repository';
export function useStudyTime() {
  const [data, setData] = useState(() => readStudyTime());
  useEffect(() => {
    let active = true;
    const reload = () => {
      if (active) setData(readStudyTime());
    };
    queueMicrotask(reload);
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(STUDY_PREFIX)) reload();
    };
    window.addEventListener(STUDY_CHANGED, reload);
    window.addEventListener('storage', storage);
    window.addEventListener('focus', reload);
    return () => {
      active = false;
      window.removeEventListener(STUDY_CHANGED, reload);
      window.removeEventListener('storage', storage);
      window.removeEventListener('focus', reload);
    };
  }, []);
  return data;
}
