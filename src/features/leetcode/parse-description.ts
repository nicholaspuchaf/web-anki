export type ExampleField = {
  label: 'Entrada' | 'Saída' | 'Explicação';
  text: string;
};
export type DescriptionBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'example'; title: string; fields: ExampleField[]; text: string[] }
  | { kind: 'constraints'; items: string[] }
  | { kind: 'followup'; text: string };
export type ProblemDescription = { title: string; blocks: DescriptionBlock[] };

/** Presentation-only parser. Keep the original pasted question intact in storage. */
export function parseDescription(source: string): ProblemDescription {
  const lines = source
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim()
    .split('\n');
  const title = lines.shift()?.trim() ?? '';
  const blocks: DescriptionBlock[] = [];
  let active: DescriptionBlock | undefined;
  let paragraph: string[] = [];
  function flushParagraph() {
    if (paragraph.length)
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  }
  for (const raw of lines) {
    const line = raw.trim();
    const example = line.match(/^(?:Example|Exemplo)\s*(\d+)\s*:\s*(.*)$/i);
    const constraints = line.match(/^(?:Constraints|Restrições)\s*:\s*(.*)$/i);
    const followup = line.match(
      /^(?:Follow[ -]?up|Desafio(?: adicional)?)\s*:\s*(.*)$/i,
    );
    if (example || constraints || followup) {
      flushParagraph();
      if (example)
        active = {
          kind: 'example',
          title: `Exemplo ${example[1]}`,
          fields: [],
          text: example[2] ? [example[2]] : [],
        };
      else if (constraints)
        active = {
          kind: 'constraints',
          items: constraints[1] ? [constraints[1]] : [],
        };
      else active = { kind: 'followup', text: followup![1] };
      blocks.push(active);
      continue;
    }
    if (!line) {
      if (!active) flushParagraph();
      continue;
    }
    if (active?.kind === 'example') {
      for (const part of line.split(
        /\s+(?=(?:Output|Saída|Explanation|Explicação)\s*:)/i,
      )) {
        const field = part.match(
          /^(Input|Entrada|Output|Saída|Explanation|Explicação)\s*:\s*(.*)$/i,
        );
        if (field) {
          const label = /^(input|entrada)$/i.test(field[1])
            ? 'Entrada'
            : /^(output|saída)$/i.test(field[1])
              ? 'Saída'
              : 'Explicação';
          active.fields.push({ label, text: field[2] });
        } else if (active.fields.length) {
          const last = active.fields[active.fields.length - 1];
          last.text += `${last.text ? (last.label === 'Explicação' ? ' ' : '\n') : ''}${part}`;
        } else active.text.push(part);
      }
    } else if (active?.kind === 'constraints')
      active.items.push(line.replace(/^[•*]\s+/, ''));
    else if (active?.kind === 'followup')
      active.text += `${active.text ? ' ' : ''}${line}`;
    else paragraph.push(line);
  }
  flushParagraph();
  return { title, blocks };
}
