import { chmod, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import tools from '../security/tools.json';

if (process.platform !== 'linux' || process.arch !== 'x64')
  throw new Error(
    'O instalador verificado do Trivy suporta Linux x64. Adicione um artefato/checksum oficial a security/tools.json para outra plataforma.',
  );
const { version, archive, sha256 } = tools.trivy;
const destination = resolve('.tools', `trivy-${version}`);
const executable = join(destination, 'trivy');
const marker = join(destination, 'binary.sha256');
function digest(bytes: Uint8Array) {
  return new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
}
if (
  (await Bun.file(executable).exists()) &&
  (await Bun.file(marker).exists())
) {
  const expected = (await Bun.file(marker).text()).trim();
  if (
    digest(new Uint8Array(await Bun.file(executable).arrayBuffer())) !==
    expected
  )
    throw new Error(
      'Executável Trivy alterado. Remova .tools/trivy-* e reinstale.',
    );
  console.log(`Trivy ${version} já está instalado.`);
  process.exit(0);
}
const temporary = await mkdtemp(join(tmpdir(), 'folha-trivy-'));
try {
  const response = await fetch(
    `https://github.com/aquasecurity/trivy/releases/download/v${version}/${archive}`,
    { signal: AbortSignal.timeout(120_000) },
  );
  if (!response.ok)
    throw new Error(`Download do Trivy falhou: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (digest(bytes) !== sha256)
    throw new Error(
      'Checksum do release Trivy não confere. Instalação interrompida.',
    );
  const path = join(temporary, archive);
  await Bun.write(path, bytes);
  const result = Bun.spawnSync(
    ['tar', '-xzf', path, '-C', temporary, 'trivy'],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  if (result.exitCode !== 0)
    throw new Error('Não foi possível extrair o Trivy.');
  await mkdir(destination, { recursive: true });
  const binary = new Uint8Array(
    await Bun.file(join(temporary, 'trivy')).arrayBuffer(),
  );
  await Bun.write(executable, binary);
  await chmod(executable, 0o755);
  await Bun.write(marker, `${digest(binary)}\n`);
  console.log(`Trivy ${version} instalado com checksum verificado.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
