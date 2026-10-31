import { writeFileSync } from 'node:fs';
const result = Bun.spawnSync(
  [
    process.env.TERRAFORM_BIN ?? 'terraform',
    '-chdir=infra/terraform',
    'output',
    '-raw',
    'api_url',
  ],
  { stdout: 'pipe', stderr: 'pipe' },
);
if (result.exitCode !== 0)
  throw new Error(
    'Execute terraform apply antes de gerar a configuração do frontend.',
  );
const url = result.stdout.toString().trim();
if (new URL(url).protocol !== 'https:')
  throw new Error('A API precisa usar HTTPS.');
writeFileSync('.env.production.local', `VITE_API_URL=${url}\n`);
console.log(
  'Endpoint público salvo em .env.production.local. Nenhuma credencial AWS é enviada ao frontend.',
);
