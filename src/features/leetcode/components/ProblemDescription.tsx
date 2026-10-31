import { Fragment } from 'react';
import { parseDescription } from '../parse-description';

function InlineText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(`[^`]+`)/g)
        .map((part, index) =>
          part.startsWith('`') && part.endsWith('`') ? (
            <code key={index}>{part.slice(1, -1)}</code>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}

export function ProblemDescription({ source }: { source: string }) {
  const { title, blocks } = parseDescription(source);
  return (
    <div className="formatted-problem">
      <h2 className="problem-title">{title}</h2>
      <div className="problem-description">
        {blocks.map((block, index) => {
          if (block.kind === 'paragraph')
            return (
              <p className="description-paragraph" key={index}>
                <InlineText text={block.text} />
              </p>
            );
          if (block.kind === 'example')
            return (
              <section
                className="description-example"
                key={index}
                aria-label={block.title}
              >
                <h3>
                  <span aria-hidden="true">↳</span> {block.title}
                </h3>
                {block.text.map((text, i) => (
                  <p key={i}>
                    <InlineText text={text} />
                  </p>
                ))}
                <dl>
                  {block.fields.map((field, i) => (
                    <div
                      className={`example-field ${field.label === 'Explicação' ? 'example-explanation' : ''}`}
                      key={i}
                    >
                      <dt>{field.label}</dt>
                      <dd>
                        {field.label === 'Explicação' ? (
                          <InlineText text={field.text} />
                        ) : (
                          <code>{field.text}</code>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          if (block.kind === 'constraints')
            return (
              <section className="description-constraints" key={index}>
                <h3>Restrições</h3>
                <ul>
                  {block.items.map((item, i) => (
                    <li key={i}>
                      <InlineText text={item} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          return (
            <section className="description-followup" key={index}>
              <h3>Desafio adicional</h3>
              <p>
                <InlineText text={block.text} />
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
