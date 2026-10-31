export {};
const includeBrowser = process.argv.includes('--e2e');
const testEnvironment = {
  ...process.env,
  VITE_API_URL: 'https://folha-api.example',
};
let testBuild = false;
let exitCode = 0;
async function run(label: string, command: string[], env = process.env) {
  console.log(`\n[check] ${label}`);
  const child = Bun.spawn(command, {
    env,
    stdin: 'ignore',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await child.exited;
  if (status !== 0) throw new Error(`${label} falhou (código ${status}).`);
}
try {
  await run('Prettier', ['bun', 'run', 'format:check']);
  await run('ESLint', ['bun', 'run', 'lint']);
  await run('TypeScript', ['bun', 'run', 'typecheck']);
  await run('Testes automatizados', ['bun', 'test']);
  await run('Build do backend', ['bun', 'run', 'build:backend']);
  await run('Terraform fmt', [
    'terraform',
    '-chdir=infra/terraform',
    'fmt',
    '-check',
    '-recursive',
  ]);
  await run('Terraform validate', [
    'terraform',
    '-chdir=infra/terraform',
    'validate',
    '-no-color',
  ]);
  if (includeBrowser) {
    testBuild = true;
    await run(
      'Build para testes de navegador',
      ['bun', 'run', 'build'],
      testEnvironment,
    );
    await run(
      'Playwright (incluindo sincronização simulada)',
      ['bun', 'run', 'test:e2e'],
      testEnvironment,
    );
  } else await run('Build do frontend', ['bun', 'run', 'build']);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = 1;
} finally {
  // Never leave dist configured with the mock API used by the browser suite.
  if (testBuild) {
    try {
      await run('Restaurar build normal do frontend', ['bun', 'run', 'build']);
    } catch {
      exitCode = 1;
    }
  }
}
process.exit(exitCode);
