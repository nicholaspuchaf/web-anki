import { join } from 'node:path';
import { CACHE, MODEL, REVISION } from './config';

export type Embed = (texts: string[]) => Promise<number[][]>;
export async function createEmbedder(allowDownload = false): Promise<Embed> {
  const { env, pipeline } = await import('@huggingface/transformers');
  env.cacheDir = join(CACHE, 'models');
  env.allowRemoteModels = allowDownload;
  env.allowLocalModels = true;
  const extractor = await pipeline('feature-extraction', MODEL, {
    revision: REVISION,
    dtype: 'q8',
    device: 'cpu',
    local_files_only: !allowDownload,
    session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 },
  });
  extractor.tokenizer.model_max_length = 256;
  // Setup may download assets. Inference itself always has remote loading disabled.
  env.allowRemoteModels = false;
  return async (texts) => {
    const vectors: number[][] = [];
    for (let index = 0; index < texts.length; index += 8) {
      const output = await extractor(texts.slice(index, index + 8), {
        pooling: 'mean',
        normalize: true,
      });
      vectors.push(...(output.tolist() as number[][]));
    }
    return vectors;
  };
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  if (!a.length || a.length !== b.length)
    throw new Error('Dimensões incompatíveis de embeddings.');
  let dot = 0,
    left = 0,
    right = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    left += a[i] * a[i];
    right += b[i] * b[i];
  }
  if (!left || !right) throw new Error('Embedding nulo.');
  return Math.max(-1, Math.min(1, dot / Math.sqrt(left * right)));
}
