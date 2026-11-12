import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bundledDeckDefinitions } from '../../src/content/decks/catalog';
import { withBundledDecks } from '../../src/features/bundled-decks/catalog';
import { emptyLibrary } from '../../src/features/library/model';
import { ROOT, isExcludedDeck } from './config';

export type Document = {
  id: string;
  deckId: string;
  deckName: string;
  sourceFile: string;
  question: string;
  answer: string;
  details: string;
  tags: string[];
};
export function contentHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function logicalIds(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.patterns))
    return data.patterns.flatMap((pattern) =>
      pattern.cards.map((card: { id: string }) => `${pattern.id}-${card.id}`),
    );
  if (Array.isArray(data.cards))
    return data.cards.map((card: { id: string }) => card.id);
  throw new Error('Formato de arquivo de flashcards não reconhecido.');
}

/** Uses the same adapters as the app, never the browser database or DynamoDB. */
export function loadCorpus(): { documents: Document[]; excluded: string[] } {
  const library = withBundledDecks(emptyLibrary);
  const excluded: string[] = [];
  const documents: Document[] = [];
  const folders = new Map(
    Array.from(
      new Bun.Glob('*/deck.json').scanSync({
        cwd: join(ROOT, 'src/content/decks'),
      }),
    ).map((path) => {
      const relative = `src/content/decks/${path}`;
      const manifest = JSON.parse(readFileSync(join(ROOT, relative), 'utf8'));
      return [manifest.id, relative.slice(0, -'/deck.json'.length)] as const;
    }),
  );
  for (const { deck, content } of bundledDeckDefinitions) {
    if (isExcludedDeck(deck.id, deck.name)) {
      excluded.push(deck.id);
      continue;
    }
    const folder = folders.get(deck.id);
    if (!folder) throw new Error(`Pasta ausente: ${deck.id}`);
    const sources = (content.flashcards ?? []).flatMap((file) => {
      const path = `${folder}/${file}`;
      const data = JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
      return logicalIds(data).map((id) => ({ id, path }));
    });
    for (const card of library.cards.filter((c) => c.deckId === deck.id)) {
      const matches = sources.filter((s) => card.id.endsWith(`-${s.id}`));
      if (matches.length !== 1)
        throw new Error(`Origem ambígua ou ausente para ${card.id}.`);
      const faces = (card.faces ?? []).filter((face) => face.content.trim());
      documents.push({
        id: card.id,
        deckId: deck.id,
        deckName: deck.name,
        sourceFile: matches[0].path,
        question: card.front,
        answer: card.back || faces[0]?.content || '',
        details: faces
          .slice(card.back ? 0 : 1)
          .map((f) => `${f.title}: ${f.content}`)
          .join('\n\n'),
        tags: card.tags ?? [],
      });
    }
  }
  return { documents, excluded };
}

export function embeddingTexts(document: Document): string[] {
  const header = `${document.question}\n${document.tags.join(', ')}`;
  const primary = `${document.question}\n${document.answer}`;
  const texts = [primary];
  // Short overlapping windows keep long optional explanations searchable.
  for (const body of [document.answer, document.details]) {
    for (let start = 0; start < body.length; start += 500) {
      const text = body.slice(start, start + 650).trim();
      if (text) texts.push(`${header}\n${text}`);
      if (start + 650 >= body.length) break;
    }
  }
  return [...new Set(texts)];
}

export function parseCandidates(value: unknown): Document[] {
  const rows = Array.isArray(value)
    ? value
    : (value as { cards?: unknown[] } | null)?.cards;
  if (!Array.isArray(rows) || !rows.length)
    throw new Error(
      'Informe um array de cartões ou { "cards": [...] } não vazio.',
    );
  const ids = new Set<string>();
  return rows.map((raw, index) => {
    if (!raw || typeof raw !== 'object')
      throw new Error(`Cartão ${index + 1} inválido.`);
    const row = raw as Record<string, unknown>;
    const question = row.question ?? row.front;
    const faces = row.faces;
    if (
      faces !== undefined &&
      (!Array.isArray(faces) ||
        faces.some((f) => !f || typeof f.content !== 'string'))
    )
      throw new Error(`Versos inválidos no cartão ${index + 1}.`);
    const providedAnswer = row.answer ?? row.back;
    if (providedAnswer !== undefined && typeof providedAnswer !== 'string')
      throw new Error(`Resposta inválida no cartão ${index + 1}.`);
    const textFaces = Array.isArray(faces)
      ? faces.filter((f) => f.content.trim())
      : [];
    const answer = providedAnswer || textFaces[0]?.content || '';
    if (
      typeof question !== 'string' ||
      !question.trim() ||
      typeof answer !== 'string'
    )
      throw new Error(`Pergunta/resposta inválida no cartão ${index + 1}.`);
    if (
      row.tags !== undefined &&
      (!Array.isArray(row.tags) || row.tags.some((t) => typeof t !== 'string'))
    )
      throw new Error(`Tags inválidas no cartão ${index + 1}.`);
    const details =
      row.explanation ??
      textFaces
        .slice(providedAnswer ? 0 : 1)
        .map((f) => f.content)
        .join('\n\n');
    if (typeof details !== 'string')
      throw new Error(`Explicação inválida no cartão ${index + 1}.`);
    const id = typeof row.id === 'string' ? row.id : `candidate-${index + 1}`;
    if (ids.has(id)) throw new Error(`ID repetido no lote: ${id}`);
    ids.add(id);
    return {
      id,
      deckId: '',
      deckName: '',
      sourceFile: '',
      question: question.trim(),
      answer,
      details,
      tags: (row.tags ?? []) as string[],
    };
  });
}
