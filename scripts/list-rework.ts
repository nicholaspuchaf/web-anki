import { listReworkRequests } from '../src/features/rework/api';

// Usage: API_URL=https://your-api.lambda-url.region.on.aws bun scripts/list-rework.ts
// Optional: bun scripts/list-rework.ts https://your-api.lambda-url.region.on.aws
if (process.argv.includes('--help')) {
  console.log(
    'Uso: API_URL=https://sua-api bun scripts/list-rework.ts\nOu: bun scripts/list-rework.ts https://sua-api\nImprime JSON na saída padrão. Não altera nem exclui marcações.',
  );
} else {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1)
      throw new Error('Informe somente a URL da API ou use API_URL.');
    const url = args[0] || process.env.API_URL || process.env.VITE_API_URL;
    if (!url)
      throw new Error(
        'Informe a URL da API no argumento ou na variável API_URL.',
      );
    const requests = await listReworkRequests(url);
    process.stdout.write(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          count: requests.length,
          requests,
        },
        null,
        2,
      ) + '\n',
    );
  } catch (cause) {
    console.error(
      `Falha ao listar cartões para refazer: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    process.exitCode = 1;
  }
}
