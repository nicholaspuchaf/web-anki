import { useEffect, useRef, useState } from 'react';
import { emptyLibrary, type Library } from '../model';
import {
  readLibrary,
  writeLibrary,
} from '../../../shared/storage/library-repository';

export type SaveLibrary = (next: Library) => Promise<boolean>;

export function useLibrary() {
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    readLibrary()
      .then((data) => {
        if (active) {
          setLibrary(data);
          setReady(true);
        }
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível abrir seus dados. Recarregue para tentar novamente.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const save: SaveLibrary = async (next) => {
    if (!ready || lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await writeLibrary(next);
      setLibrary(next);
      return true;
    } catch {
      setError(
        'Não foi possível salvar. Verifique o espaço disponível e tente novamente.',
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { library, ready, busy, error, setError, save };
}
