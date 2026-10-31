import { ProblemDescription } from './ProblemDescription';
import { useState } from 'react';
import type { Card } from '../../library/model';
import { difficultyLabels, faceLabels, getAvailableFaces } from '../model';
import { TagList } from './TagList';
import { CodeBlock } from './CodeBlock';

type Props = { card: Card; onReveal?: () => void };
export function LeetCodeCard({ card, onReveal }: Props) {
  const data = card.leetcode!;
  const [activeFace, setActiveFace] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [scratchpad, setScratchpad] = useState('');
  const availableFaces = getAvailableFaces(data);
  const face = availableFaces.find((f) => f.id === activeFace);
  const hints = availableFaces.filter((f) => f.kind === 'hint');
  const nextHint = hints.find((f) => !seen.includes(f.id));
  function open(id: string) {
    setActiveFace(id);
    setSeen((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    onReveal?.();
  }
  return (
    <div className={`leetcode-card accent-${data.accent}`}>
      <section className="problem-pane">
        <div className="pane-bar">
          <span>▤ Descrição</span>
          <span className="pane-label">Problema resolvido</span>
        </div>
        <div className="pane-body">
          <div className="problem-topline">
            <span className="eyebrow">
              LEETCODE {data.number && ` / #${data.number}`}
            </span>
            <span className={`difficulty ${data.difficulty}`}>
              {difficultyLabels[data.difficulty]}
            </span>
          </div>
          <ProblemDescription source={card.front} />
          <div className="problem-links">
            {data.url && (
              <a href={data.url} target="_blank" rel="noreferrer">
                Abrir problema ↗
              </a>
            )}
            <TagList tags={data.tags} />
          </div>
          {data.constraints && (
            <section className="problem-section">
              <h3>Restrições e casos de borda</h3>
              <p className="preserve-text">{data.constraints}</p>
            </section>
          )}
          <details className="scratchpad">
            <summary>Esboçar minha tentativa</summary>
            <p>
              Espaço temporário para raciocinar antes de revelar os versos. Não
              é salvo.
            </p>
            <textarea
              aria-label="Minha tentativa temporária"
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Qual é a ideia? Qual estrutura de dados eu usaria?"
            />
          </details>
        </div>
      </section>
      <section className="answer-pane">
        <div className="pane-bar">
          <span>〈/〉 Revisão</span>
          <span className="pane-label">{availableFaces.length} versos</span>
        </div>
        <div className="pane-body">
          {availableFaces.length > 0 && (
            <div className="face-navigation">
              <span className="eyebrow">EXPLORE OS VERSOS</span>
              <div className="face-options">
                {availableFaces.map((f, index) => (
                  <button
                    key={f.id}
                    className={activeFace === f.id ? 'active' : ''}
                    aria-pressed={activeFace === f.id}
                    onClick={() => open(f.id)}
                  >
                    <span>
                      {f.kind === 'hint'
                        ? '✧'
                        : f.kind === 'solution'
                          ? '</>'
                          : f.kind === 'answer'
                            ? '✎'
                            : '▤'}
                    </span>{' '}
                    {f.title.trim() || faceLabels[f.kind]}
                    <small>
                      {seen.includes(f.id)
                        ? 'visto'
                        : String(index + 1).padStart(2, '0')}
                    </small>
                  </button>
                ))}
              </div>
              {nextHint && (
                <button className="next-hint" onClick={() => open(nextHint.id)}>
                  Revelar próxima dica ·{' '}
                  {hints.filter((h) => seen.includes(h.id)).length}/
                  {hints.length}
                </button>
              )}
            </div>
          )}
          {face ? (
            <section className="face-content" aria-label="Verso selecionado">
              <div className="face-content-heading">
                <div>
                  <span className="eyebrow">{faceLabels[face.kind]}</span>
                  <h3>{face.title.trim() || faceLabels[face.kind]}</h3>
                </div>
                <button onClick={() => setActiveFace(null)}>
                  Voltar à pergunta
                </button>
              </div>
              {face.kind === 'solution' ? (
                <>
                  <CodeBlock code={face.content} language={face.language} />
                </>
              ) : (
                <div className="preserve-text face-text">{face.content}</div>
              )}
            </section>
          ) : (
            <div className="recall-prompt">
              {availableFaces.length
                ? 'Selecione um verso para revelar.'
                : 'Nenhum verso preenchido ainda.'}
              <br />
              <span>
                {availableFaces.length
                  ? 'Tente lembrar a abordagem antes de consultar as dicas ou o código.'
                  : 'Você pode revisar a pergunta e adicionar dicas ou respostas depois.'}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
