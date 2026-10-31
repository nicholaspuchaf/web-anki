import type { Library } from '../library/model';
import type { SaveLibrary } from '../library/hooks/use-library';
import { parseBackup } from './parse-backup';

export function useBackup(
  library: Library,
  save: SaveLibrary,
  onError: (message: string) => void,
  onNotice: (message: string) => void,
) {
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(library, null, 2)], {
        type: 'application/json',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `folha-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    onNotice('Backup exportado. Guarde o arquivo em um lugar seguro.');
  }
  async function importBackup(input: File) {
    try {
      if (input.size > 10_000_000)
        throw new Error('O backup deve ter até 10 MB.');
      const next = parseBackup(await input.text());
      if (
        !window.confirm(
          `Restaurar ${next.decks.length} baralho(s) e ${next.cards.length} cartão(ões)? Isso substituirá todos os dados deste aparelho.`,
        )
      )
        return false;
      if (await save(next)) {
        onNotice('Backup restaurado com sucesso.');
        return true;
      }
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : 'Não foi possível importar o backup.',
      );
    }
    return false;
  }
  return { exportBackup, importBackup };
}
