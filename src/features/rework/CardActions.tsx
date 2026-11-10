import { useRef, useState } from 'react';
import type { Card } from '../library/model';
import { useOnline } from '../../shared/hooks/use-online';
import { markForRework } from './api';
import './rework.css';

export function CardActions({
  card,
  source = card.sourceUrl,
  sourceLabel = 'Consultar fonte ↗',
  reportable = true,
}: {
  card: Card;
  source?: string;
  sourceLabel?: string;
  reportable?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'marked'>('idle');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const online = useOnline();
  const base = import.meta.env.VITE_API_URL ?? '';
  if (!source && !reportable) return null;
  return (
    <div className="card-actions">
      {source && (
        <a
          className="standard-source"
          href={source}
          target="_blank"
          rel="noreferrer"
        >
          {sourceLabel}
        </a>
      )}
      {reportable && (
        <button
          className={`rework-button${status === 'marked' ? ' is-marked' : ''}`}
          disabled={!base || !online || status !== 'idle'}
          title={
            !base
              ? 'Serviço de marcação indisponível neste ambiente.'
              : !online
                ? 'Conecte-se para marcar este cartão.'
                : 'Pedir que o conteúdo deste flashcard seja refeito'
          }
          onClick={async () => {
            if (lock.current) return;
            lock.current = true;
            setStatus('sending');
            setError('');
            try {
              await markForRework(base, card);
              setStatus('marked');
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Não foi possível marcar. Tente novamente.',
              );
              setStatus('idle');
            } finally {
              lock.current = false;
            }
          }}
        >
          {status === 'marked'
            ? 'Marcado para refazer'
            : status === 'sending'
              ? 'Marcando…'
              : 'Refazer'}
        </button>
      )}
      {status === 'marked' && (
        <span className="sr-only" role="status">
          Cartão marcado para refazer o conteúdo.
        </span>
      )}
      {error && (
        <span className="rework-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
