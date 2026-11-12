import { Database } from 'bun:sqlite';
import { contentHash, embeddingTexts, type Document } from './corpus';
import { EMBEDDING_VERSION } from './config';
import type { Embed } from './embeddings';

type Stored = { id: string; hash: string; document: string };
export class SearchIndex {
  readonly db: Database;
  constructor(path: string) {
    this.db = new Database(path, { strict: true });
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS cards(id TEXT PRIMARY KEY, hash TEXT NOT NULL, document TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS chunks(card_id TEXT REFERENCES cards(id) ON DELETE CASCADE, position INTEGER, vector BLOB NOT NULL, PRIMARY KEY(card_id, position));
      CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(id UNINDEXED, question, answer, details, tags, tokenize='unicode61 remove_diacritics 2');`);
  }
  close() {
    this.db.close();
  }
  meta(key: string) {
    return this.db
      .query<{ value: string }, [string]>(
        'SELECT value FROM metadata WHERE key=?',
      )
      .get(key)?.value;
  }
  documents() {
    return this.db
      .query<Stored, []>('SELECT id, hash, document FROM cards ORDER BY id')
      .all();
  }
  status(documents: Document[]) {
    const stored = this.documents();
    const expected = new Map(
      documents.map((d) => [d.id, contentHash(embeddingTexts(d))]),
    );
    const previous = new Map(stored.map((d) => [d.id, d]));
    const modelChanged = this.meta('embedding_version') !== EMBEDDING_VERSION;
    return {
      stored: stored.length,
      eligible: documents.length,
      modelChanged,
      changed: documents
        .filter(
          (d) =>
            modelChanged || previous.get(d.id)?.hash !== expected.get(d.id),
        )
        .map((d) => d.id),
      metadataChanged: documents
        .filter(
          (d) =>
            previous.has(d.id) &&
            previous.get(d.id)?.document !== JSON.stringify(d),
        )
        .map((d) => d.id),
      removed: stored.filter((d) => !expected.has(d.id)).map((d) => d.id),
    };
  }
  async synchronize(documents: Document[], embed: Embed) {
    if (new Set(documents.map((d) => d.id)).size !== documents.length)
      throw new Error('IDs duplicados no acervo.');
    const generation = this.meta('generation');
    const state = this.status(documents);
    const changed = new Set(state.changed);
    const prepared = new Map<string, number[][]>();
    let dimension = state.modelChanged
      ? undefined
      : Number(this.meta('dimension')) || undefined;
    for (const document of documents.filter((d) => changed.has(d.id))) {
      const texts = embeddingTexts(document);
      const vectors = await embed(texts);
      if (vectors.length !== texts.length)
        throw new Error('Quantidade incorreta de embeddings.');
      for (const vector of vectors) {
        dimension ??= vector.length;
        if (
          !dimension ||
          vector.length !== dimension ||
          vector.some((v) => !Number.isFinite(v)) ||
          !vector.some((v) => v !== 0)
        )
          throw new Error('Embedding inválido; índice anterior preservado.');
      }
      prepared.set(document.id, vectors);
    }
    if (
      !state.changed.length &&
      !state.metadataChanged.length &&
      !state.removed.length &&
      !state.modelChanged
    )
      return {
        updated: 0,
        metadataUpdated: 0,
        removed: 0,
        total: documents.length,
      };
    this.db
      .transaction(() => {
        if (this.meta('generation') !== generation)
          throw new Error(
            'Índice alterado por outro processo. Execute novamente.',
          );
        const removeFts = this.db.query('DELETE FROM cards_fts WHERE id=?');
        for (const id of state.removed) {
          removeFts.run(id);
          this.db.query('DELETE FROM cards WHERE id=?').run(id);
        }
        for (const document of documents) {
          if (
            !changed.has(document.id) &&
            !state.metadataChanged.includes(document.id)
          )
            continue;
          this.db
            .query(
              'INSERT INTO cards VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET hash=excluded.hash, document=excluded.document',
            )
            .run(
              document.id,
              contentHash(embeddingTexts(document)),
              JSON.stringify(document),
            );
          removeFts.run(document.id);
          this.db
            .query(
              'INSERT INTO cards_fts(id, question, answer, details, tags) VALUES(?, ?, ?, ?, ?)',
            )
            .run(
              document.id,
              document.question,
              document.answer,
              document.details,
              document.tags.join(' '),
            );
          const vectors = prepared.get(document.id);
          if (vectors) {
            this.db
              .query('DELETE FROM chunks WHERE card_id=?')
              .run(document.id);
            vectors.forEach((vector, position) =>
              this.db
                .query('INSERT INTO chunks VALUES (?, ?, ?)')
                .run(
                  document.id,
                  position,
                  new Uint8Array(new Float32Array(vector).buffer),
                ),
            );
          }
        }
        const put = this.db.query(
          'INSERT INTO metadata VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
        );
        put.run('embedding_version', EMBEDDING_VERSION);
        put.run('dimension', String(dimension ?? 0));
        put.run('generation', crypto.randomUUID());
        put.run('updated_at', new Date().toISOString());
      })
      .immediate();
    return {
      updated: state.changed.length,
      metadataUpdated: state.metadataChanged.filter((id) => !changed.has(id))
        .length,
      removed: state.removed.length,
      total: documents.length,
    };
  }
  vectors() {
    return this.db
      .query<{ card_id: string; position: number; vector: Uint8Array }, []>(
        'SELECT card_id, position, vector FROM chunks',
      )
      .all()
      .map((row) => ({
        id: row.card_id,
        position: row.position,
        vector: Array.from(new Float32Array(row.vector.slice().buffer)),
      }));
  }
  lexical(query: string) {
    const stop = new Set([
      'que',
      'qual',
      'quais',
      'como',
      'para',
      'por',
      'uma',
      'com',
      'dos',
      'das',
      'the',
      'what',
      'how',
      'why',
    ]);
    const terms = [
      ...new Set(query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []),
    ]
      .filter((t) => t.length > 1 && !stop.has(t))
      .slice(0, 40);
    if (!terms.length) return [];
    return this.db
      .query<{ id: string; score: number }, [string]>(
        `SELECT id, bm25(cards_fts, 0, 4, 3, 1, 2) AS score FROM cards_fts WHERE cards_fts MATCH ? ORDER BY score LIMIT 100`,
      )
      .all(terms.map((t) => `"${t}"`).join(' OR '));
  }
}
