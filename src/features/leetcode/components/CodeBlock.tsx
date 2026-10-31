import { useState } from 'react';
export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [status, setStatus] = useState('');
  return (
    <div className="solution-code">
      <div className="code-toolbar">
        <span>{language || 'código'}</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setStatus('Copiado!');
            } catch {
              setStatus('Selecione o código para copiar.');
            }
          }}
        >
          Copiar código
        </button>
      </div>
      <pre tabIndex={0} aria-label={`Solução em ${language || 'código'}`}>
        <code>
          {code.split('\n').map((line, index) => (
            <span className="code-line" key={index}>
              <span aria-hidden="true" className="line-number">
                {index + 1}
              </span>
              <span>{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>
      {status && <p role="status">{status}</p>}
    </div>
  );
}
