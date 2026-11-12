import { join } from 'node:path';
import { CACHE, MODEL, REVISION } from './config';

export type Embed = (texts: string[]) => Promise<number[][]>;
export async function createEmbedder(allowDownload = false): Promise<Embed> {
  const { env, AutoTokenizer, AutoModel, FeatureExtractionPipeline } =
    await import('@huggingface/transformers');
  env.cacheDir = join(CACHE, 'models');
  env.allowRemoteModels = allowDownload;
  env.allowLocalModels = true;
  // v4 tokenizer discovery omits revision; pin its metadata requests too.
  env.remotePathTemplate = `{model}/resolve/${REVISION}/`;
  const options = {
    cache_dir: env.cacheDir,
    revision: REVISION,
    local_files_only: !allowDownload,
  };
  // Load explicitly: v4 pipeline discovery does not forward the pinned revision.
  const tokenizer = await AutoTokenizer.from_pretrained(
    allowDownload ? MODEL : join(env.cacheDir, MODEL, REVISION),
    options,
  );
  tokenizer.config.model_max_length = 256;
  const model = await AutoModel.from_pretrained(MODEL, {
    ...options,
    dtype: 'q8',
    device: 'cpu',
    session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 },
  });
  const extractor = new FeatureExtractionPipeline({
    task: 'feature-extraction',
    model,
    tokenizer,
  });
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
