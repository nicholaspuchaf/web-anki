export {};
if (process.env.CI || process.env.CF_PAGES) process.exit(0);
const root = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel'], {
  stdout: 'pipe',
  stderr: 'ignore',
});
if (root.exitCode !== 0) process.exit(0);
const existing = Bun.spawnSync(
  ['git', 'config', '--local', '--get', 'core.hooksPath'],
  { stdout: 'pipe', stderr: 'ignore' },
)
  .stdout.toString()
  .trim();
if (existing && existing !== '.githooks')
  throw new Error(
    `core.hooksPath já está configurado como ${existing}. Integre o Lefthook com esse diretório antes de instalar.`,
  );
// Migrate only the manual hook path installed earlier by this project.
if (existing === '.githooks') {
  const migration = Bun.spawnSync(
    ['git', 'config', '--local', '--unset', 'core.hooksPath'],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  if (migration.exitCode !== 0) process.exit(migration.exitCode);
}
const result = Bun.spawnSync(
  ['bun', 'x', '--no-install', 'lefthook', 'install'],
  { stdout: 'inherit', stderr: 'inherit' },
);
if (result.exitCode !== 0) process.exit(result.exitCode);
console.log('Lefthook instalado: o pre-push executará segurança e qualidade.');
