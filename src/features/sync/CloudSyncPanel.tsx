import type { Library } from '../library/model';
import type { SaveLibrary } from '../library/hooks/use-library';
import { useOnline } from '../../shared/hooks/use-online';
import { Alert } from '../../shared/ui/Alert';
import { useCloudSync } from './use-cloud-sync';

type Props = {
  library: Library;
  save: SaveLibrary;
  busy: boolean;
  apiUrl: string;
};
export function CloudSyncPanel({ library, save, busy, apiUrl }: Props) {
  const online = useOnline();
  const cloud = useCloudSync(apiUrl, library, save);
  const disabled = !online || busy || cloud.working;
  return (
    <section className="cloud-panel" aria-labelledby="cloud-title">
      <div className="cloud-heading">
        <div>
          <p className="eyebrow">SINCRONIZAÇÃO MANUAL</p>
          <h2 id="cloud-title">Biblioteca pública compartilhada</h2>
          <p>
            Todos acessam os mesmos cartões. Não envie informações privadas.
          </p>
        </div>
        <span className="difficulty">DynamoDB</span>
      </div>
      <div className="cloud-actions">
        <button disabled={disabled} onClick={() => void cloud.check()}>
          {cloud.working ? 'Sincronizando…' : 'Verificar nuvem'}
        </button>
        <button
          disabled={disabled || !cloud.remote}
          onClick={() => void cloud.download()}
        >
          ↓ Baixar biblioteca
        </button>
        <button
          className="primary"
          disabled={disabled || !cloud.remote}
          onClick={() => void cloud.upload()}
        >
          ↑ Enviar biblioteca
        </button>
      </div>
      {cloud.remote && (
        <p className="cloud-status">
          Na nuvem: {cloud.remote.library.cards.length} cartões ·{' '}
          {cloud.remote.updatedAt
            ? `atualizada em ${new Date(cloud.remote.updatedAt).toLocaleString('pt-BR')}`
            : 'nenhuma publicação ainda'}
        </p>
      )}
      {!online && (
        <p className="cloud-status">
          Offline: continue estudando neste aparelho e sincronize quando
          conectar.
        </p>
      )}
      {cloud.message && <Alert>{cloud.message}</Alert>}
      {cloud.error && <Alert error>{cloud.error}</Alert>}
    </section>
  );
}
