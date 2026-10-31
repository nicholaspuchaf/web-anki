import { useRef, useState } from 'react';
import { CloudError, createCloudApi, type CloudSnapshot } from './api';
import type { Library } from '../library/model';
import type { SaveLibrary } from '../library/hooks/use-library';

export function useCloudSync(
  apiUrl: string,
  library: Library,
  save: SaveLibrary,
) {
  const [remote, setRemote] = useState<CloudSnapshot | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const api = createCloudApi(apiUrl);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setWorking(true);
    setMessage('');
    setError('');
    try {
      await action();
    } catch (cause) {
      if (cause instanceof CloudError && cause.status === 409) setRemote(null);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Falha na sincronização. Seus dados locais foram preservados.',
      );
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }
  function check() {
    return run(async () => {
      setRemote(await api.get());
      setMessage('Versão da nuvem verificada. Escolha baixar ou enviar.');
    });
  }
  function download() {
    return run(async () => {
      if (!remote) return;
      if (
        (library.cards.length || library.decks.length) &&
        !window.confirm(
          'Baixar a biblioteca pública e substituir todos os dados deste aparelho? Exporte um backup antes, se quiser preservar a versão local.',
        )
      )
        return;
      if (await save(remote.library))
        setMessage('Biblioteca da nuvem salva neste aparelho.');
    });
  }
  function upload() {
    return run(async () => {
      if (!remote) return;
      if (
        !window.confirm(
          `Publicar ${library.cards.length} cartão(ões) e substituir a biblioteca compartilhada? Qualquer pessoa poderá ver, editar e excluir esses dados.`,
        )
      )
        return;
      const result = await api.put(library, remote.revision);
      setRemote({ ...result, library });
      setMessage(
        'Biblioteca publicada. Os outros aparelhos podem verificar e baixar esta versão.',
      );
    });
  }
  return { remote, working, message, error, check, download, upload };
}
