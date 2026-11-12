import { cosine } from './embeddings';
import type { Document } from './corpus';
import type { SearchIndex } from './index';

export type Match = Document & {
  semanticSimilarity: number;
  lexicalRank: number | null;
  rankScore: number;
};
export function search(
  index: SearchIndex,
  query: string,
  vector: number[],
  limit: number,
  excludeId?: string,
): Match[] {
  const documents = new Map(
    index
      .documents()
      .map((row) => [row.id, JSON.parse(row.document) as Document]),
  );
  const scores = new Map<string, number>();
  for (const row of index.vectors()) {
    if (row.id === excludeId) continue;
    // Optional explanations provide context; they should not outweigh a matching primary answer.
    const similarity = cosine(vector, row.vector) * (row.position ? 0.95 : 1);
    scores.set(row.id, Math.max(scores.get(row.id) ?? -1, similarity));
  }
  const semantic = [...scores].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const lexical = index.lexical(query).filter((row) => row.id !== excludeId);
  const lexicalRanks = new Map(lexical.map((row, rank) => [row.id, rank + 1]));
  const fused = new Map(
    semantic.map(([id], rank) => [id, 1 / (60 + rank + 1)]),
  );
  lexical.forEach((row, rank) =>
    fused.set(row.id, (fused.get(row.id) ?? 0) + 1 / (60 + rank + 1)),
  );
  return [...fused]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, rankScore]) => ({
      ...documents.get(id)!,
      semanticSimilarity: scores.get(id) ?? 0,
      lexicalRank: lexicalRanks.get(id) ?? null,
      rankScore,
    }));
}

export function batchNeighbors(
  documents: Document[],
  vectors: number[][],
  limit: number,
) {
  return documents.map((document, index) => ({
    id: document.id,
    matches: documents
      .filter((_, other) => other !== index)
      .map((other) => ({
        id: other.id,
        question: other.question,
        semanticSimilarity: cosine(
          vectors[index],
          vectors[documents.indexOf(other)],
        ),
      }))
      .sort(
        (a, b) =>
          b.semanticSimilarity - a.semanticSimilarity ||
          a.id.localeCompare(b.id),
      )
      .slice(0, limit),
  }));
}
