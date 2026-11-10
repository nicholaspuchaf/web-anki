import { useState } from 'react';
import { bundledDeckDefinitions } from '../../content/decks/catalog';
import type { Library } from '../library/model';
import { useFeed } from '../feed/use-feed';
import { carouselDeckId } from '../feed/decks';
import { Alert } from '../../shared/ui/Alert';
import { useSettings } from './use-settings';
import './settings.css';

export default function SettingsPage({ library }: { library: Library }) {
  const feed = useFeed();
  const { disabledDecks, setDeckEnabled } = useSettings();
  const [error, setError] = useState('');
  return (
    <section className="settings-page">
      <header>
        <h1>Configurações</h1>
        <p>
          Escolha os baralhos do aplicativo que deseja estudar neste aparelho.
        </p>
      </header>
      <h2>Baralhos incluídos</h2>
      <p className="settings-help">
        Desativar oculta o baralho dos flashcards e do Feed. Seu conteúdo,
        favoritos e progresso são preservados.
      </p>
      {error && (
        <Alert error onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {feed.error && <Alert error>{feed.error}</Alert>}
      <div className="settings-decks">
        {bundledDeckDefinitions.map(({ deck }) => {
          const enabled = !disabledDecks.includes(deck.id);
          const cards = library.cards.filter(
            (card) => card.deckId === deck.id,
          ).length;
          const carousels = feed.data.carousels.filter(
            (carousel) => carouselDeckId(carousel) === deck.id,
          ).length;
          return (
            <label className="settings-deck" key={deck.id}>
              <input
                type="checkbox"
                checked={enabled}
                aria-label={`Ativar ${deck.name}`}
                onChange={(event) => {
                  try {
                    setDeckEnabled(deck.id, event.target.checked);
                    setError('');
                  } catch {
                    setError(
                      'Não foi possível salvar a configuração. A escolha anterior foi mantida. Verifique o armazenamento deste aparelho e tente novamente.',
                    );
                  }
                }}
              />
              <span className="settings-deck-body">
                <strong>{deck.name}</strong>
                <span>
                  {cards} {cards === 1 ? 'flashcard' : 'flashcards'} ·{' '}
                  {feed.ready
                    ? `${carousels} ${carousels === 1 ? 'carrossel' : 'carrosséis'}`
                    : 'Carregando carrosséis…'}
                </span>
              </span>
              <span className={`settings-state${enabled ? ' enabled' : ''}`}>
                {enabled ? 'Ativo' : 'Desativado'}
              </span>
            </label>
          );
        })}
      </div>
      <p className="settings-help">
        As escolhas ficam salvas apenas neste navegador. Backups e histórico da
        Administração continuam incluindo os baralhos desativados.
      </p>
    </section>
  );
}
