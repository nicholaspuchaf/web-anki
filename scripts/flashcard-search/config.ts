import { resolve } from 'node:path';
import packageJson from '../../package.json';

export const ROOT = resolve(import.meta.dir, '../..');
export const CACHE = resolve(ROOT, '.cache/flashcard-search');
export const DATABASE = resolve(CACHE, 'index.sqlite');
export const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
export const REVISION = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
// Runtime/tokenizer upgrades must not mix old stored vectors with new queries.
export const EMBEDDING_VERSION = `${MODEL}@${REVISION}:transformers-${packageJson.devDependencies['@huggingface/transformers']}:q8:mean:normalized:max256:chunks-v1`;
export const EXCLUDED_DECK_IDS = new Set(['builtin-mc714']);
export function isExcludedDeck(id: string, name: string) {
  return EXCLUDED_DECK_IDS.has(id) || /\(\s*antigo\s*\)/iu.test(name);
}
