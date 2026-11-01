import type { Library } from '../library/model';
import { useOnline } from '../../shared/hooks/use-online';
import { Alert } from '../../shared/ui/Alert';
import type { CloudSync } from './use-cloud-sync';
import { ConflictPreview } from './ConflictPreview';
import { localContent, remoteContent } from './model';

export function CloudSyncPanel({
  library,
  cloud,
  busy,
}: {
  library: Library;
  cloud: CloudSync;
  busy: boolean;
}) {
  const online = useOnline();
  const disabled = !online || busy || cloud.working;
  return (
    <section className="cloud-panel" aria-labelledby="cloud-title">
      <div className="cloud-heading">
        <div>
          <p className="eyebrow">SINCRONIZAÇÃO MANUAL</p>
          <h2 id="cloud-title">Biblioteca pública compartilhada</h2>
          <p>
            Sincronizar recebe alterações da nuvem e publica as suas. Todos
            podem ver, editar e excluir os mesmos cartões.
          </p>
        </div>
        <span className="difficulty">Nuvem</span>
      </div>
      <div className="cloud-actions">
        <button
          className="primary"
          disabled={disabled}
          onClick={() => void cloud.sync()}
        >
          {cloud.working ? 'Sincronizando…' : 'Sincronizar'}
        </button>
        <button disabled={disabled} onClick={() => void cloud.sync(true)}>
          Reconciliar biblioteca
        </button>
      </div>
      <p className="cloud-status">
        {cloud.pending} alteração(ões) local(is) para enviar ·{' '}
        {cloud.state.last_sync_at
          ? `Última sincronização: ${new Date(cloud.state.last_sync_at).toLocaleString('pt-BR')}`
          : 'Este aparelho ainda não foi sincronizado.'}
      </p>
      <p className="cloud-status">
        A reconciliação verifica todos os cartões no primeiro uso e a cada 24
        horas, ao sincronizar. Baralhos vazios ficam apenas neste aparelho.
      </p>
      {Object.values(cloud.state.conflicts).map((remote) => {
        const local = library.cards.find(
          (card) => card.id === remote.flashcard_id,
        );
        const title =
          local?.front ??
          (remote.deleted_at === null
            ? remote.card.front
            : remote.flashcard_id);
        return (
          <article className="sync-conflict" key={remote.flashcard_id}>
            <h3>Conflito: {title}</h3>
            <div className="sync-conflict-versions">
              <details>
                <summary>
                  Minha versão{local ? '' : ' · excluído neste aparelho'}
                </summary>
                <ConflictPreview
                  content={localContent(library, remote.flashcard_id)}
                />
              </details>
              <details>
                <summary>
                  Versão da nuvem
                  {remote.deleted_at !== null ? ' · excluído' : ''}
                </summary>
                <ConflictPreview content={remoteContent(remote)} />
              </details>
            </div>
            <div className="cloud-actions">
              <button
                disabled={disabled}
                onClick={() => void cloud.resolve(remote.flashcard_id, 'local')}
              >
                Manter minha alteração
              </button>
              <button
                disabled={disabled}
                onClick={() =>
                  void cloud.resolve(remote.flashcard_id, 'remote')
                }
              >
                Usar versão da nuvem
              </button>
            </div>
          </article>
        );
      })}
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
