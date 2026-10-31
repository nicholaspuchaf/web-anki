import { resolve } from 'node:path';
import tools from '../security/tools.json';
const binary = resolve('.tools', `trivy-${tools.trivy.version}`, 'trivy');
if (!(await Bun.file(binary).exists()))
  throw new Error('Trivy não instalado. Execute bun run security:setup.');
const result = Bun.spawnSync([binary, 'fs', '--config', 'trivy.yaml', '.'], {
  stdout: 'inherit',
  stderr: 'inherit',
});
process.exit(result.exitCode);
