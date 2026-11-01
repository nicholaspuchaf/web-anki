import { useEffect, useRef, useState } from 'react';
import { createCloudApi } from './api';
import type { Library } from '../library/model';
import { createSyncRepository } from '../../shared/storage/library-repository';
import { createSyncEngine } from './engine';
import { emptySyncState, pendingIds, type SyncState } from './model';

export function useCloudSync(
  apiUrl: string,
  library: Library,
  reload: () => Promise<void>,
) {
  const [state, setState] = useState<SyncState>(emptySyncState);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    if (!apiUrl) return;
    let active = true;
    createSyncRepository(apiUrl)
      .read()
      .then((snapshot) => {
        if (active) setState(snapshot.state);
      })
      .catch(() => {
        if (active)
          setError('Não foi possível abrir os dados de sincronização.');
      });
    return () => {
      active = false;
    };
  }, [apiUrl]);
  async function run(
    action: (engine: ReturnType<typeof createSyncEngine>) => Promise<string>,
  ) {
    if (!apiUrl || lock.current) return;
    lock.current = true;
    setWorking(true);
    setMessage('');
    setError('');
    const repository = createSyncRepository(apiUrl);
    try {
      const result = await action(
        createSyncEngine(createCloudApi(apiUrl), repository),
      );
      setMessage(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Falha na sincronização. Tente novamente.',
      );
    } finally {
      try {
        const snapshot = await repository.read();
        setState(snapshot.state);
        await reload();
      } catch {
        setError(
          'Não foi possível atualizar a tela. Recarregue antes de continuar.',
        );
      }
      lock.current = false;
      setWorking(false);
    }
  }
  function sync(full = false) {
    return run(async (engine) => {
      const result = await engine.sync(full);
      const conflicts = Object.keys(result.snapshot.state.conflicts).length;
      return conflicts
        ? `${conflicts} conflito(s) precisam da sua escolha. Suas alterações locais foram preservadas.`
        : `Sincronização concluída. ${result.sent} alteração(ões) enviada(s).`;
    });
  }
  function resolve(id: string, choice: 'local' | 'remote') {
    return run(async (engine) => {
      await engine.resolve(id, choice);
      return choice === 'local'
        ? 'Alteração local mantida. Clique em Sincronizar para publicá-la.'
        : 'Versão da nuvem aplicada neste aparelho.';
    });
  }
  return {
    state,
    working,
    message,
    error,
    sync,
    resolve,
    pending: pendingIds(library, state).length,
  };
}
export type CloudSync = ReturnType<typeof useCloudSync>;
