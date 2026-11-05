export type Dependency = { name: string; version: string };
export type MalwareFinding = Dependency & { advisory: string };
type Request = (url: string, options: RequestInit) => Promise<Response>;

export function lockedDependencies(text: string): Dependency[] {
  const lock = Bun.JSONC.parse(text) as { packages?: Record<string, unknown> };
  if (!lock || !lock.packages || typeof lock.packages !== 'object')
    throw new Error('bun.lock inválido ou sem packages.');
  const unique = new Map<string, Dependency>();
  for (const entry of Object.values(lock.packages)) {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string')
      throw new Error('Entrada inválida no lockfile.');
    const match = entry[0].match(
      /^(@[^/]+\/[^@]+|[^@]+)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/,
    );
    if (!match)
      throw new Error(
        `Dependência não analisável pelo catálogo npm/OSV: ${entry[0]}. Revise a origem antes de liberar o push.`,
      );
    unique.set(entry[0], { name: match[1], version: match[2] });
  }
  if (!unique.size)
    throw new Error('Nenhuma dependência encontrada para analisar.');
  return [...unique.values()];
}

export async function knownMalware(
  dependencies: Dependency[],
  request: Request = fetch,
  options: { timeoutMs?: number; onProgress?: (message: string) => void } = {},
): Promise<MalwareFinding[]> {
  const findings: MalwareFinding[] = [];
  const timeoutMs = options.timeoutMs ?? 30_000;
  for (let offset = 0; offset < dependencies.length; offset += 100) {
    let pending = dependencies
      .slice(offset, offset + 100)
      .map((dependency) => ({ dependency, token: '' }));
    for (let page = 0; pending.length; page++) {
      if (page > 20)
        throw new Error('Paginação OSV excessiva. Verificação interrompida.');
      const endpoint = 'https://api.osv.dev/v1/querybatch';
      const context = `lote ${Math.floor(offset / 100) + 1}/${Math.ceil(dependencies.length / 100)}, página ${page + 1}, ${pending.length} pacote(s)`;
      options.onProgress?.(
        `OSV: ${context}; limite de ${timeoutMs / 1000} s por requisição.`,
      );
      const signal = AbortSignal.timeout(timeoutMs);
      let data: unknown;
      try {
        const response = await request(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal,
          body: JSON.stringify({
            queries: pending.map(({ dependency, token }) => ({
              package: { ecosystem: 'npm', name: dependency.name },
              version: dependency.version,
              ...(token ? { page_token: token } : {}),
            })),
          }),
        });
        if (!response.ok)
          throw new Error(
            `HTTP ${response.status}${response.statusText ? ' ' + response.statusText : ''}`,
          );
        data = await response.json();
      } catch (error) {
        const timedOut =
          signal.aborted ||
          (error instanceof Error && error.name === 'TimeoutError');
        const reason = timedOut
          ? `tempo limite de ${timeoutMs / 1000} s excedido`
          : 'falha na consulta ou leitura da resposta';
        throw new Error(
          `OSV: ${reason} (${context}). Endpoint: ${endpoint}. Causa: ${errorDetails(error)}`,
          { cause: error },
        );
      }
      const results =
        data && typeof data === 'object' && 'results' in data
          ? data.results
          : null;
      if (!Array.isArray(results) || results.length !== pending.length)
        throw new Error(
          `Resposta OSV incompleta (${context}): esperados ${pending.length} resultados, recebidos ${Array.isArray(results) ? results.length : 'formato inválido'}. Não é possível concluir a verificação.`,
        );
      const next: typeof pending = [];
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (
          !result ||
          typeof result !== 'object' ||
          (result.vulns !== undefined && !Array.isArray(result.vulns))
        )
          throw new Error('Resultado OSV inválido.');
        for (const advisory of result.vulns ?? []) {
          if (typeof advisory?.id !== 'string')
            throw new Error('Aviso OSV inválido.');
          if (advisory.id.startsWith('MAL-'))
            findings.push({
              ...pending[index].dependency,
              advisory: advisory.id,
            });
        }
        if (result.next_page_token) {
          if (
            typeof result.next_page_token !== 'string' ||
            result.next_page_token === pending[index].token
          )
            throw new Error('Paginação OSV inválida.');
          next.push({
            dependency: pending[index].dependency,
            token: result.next_page_token,
          });
        }
      }
      pending = next;
    }
  }
  return findings;
}

function errorDetails(error: unknown): string {
  const details: string[] = [];
  const seen = new Set<unknown>();
  for (
    let depth = 0;
    error !== undefined && depth < 4 && !seen.has(error);
    depth++
  ) {
    seen.add(error);
    if (!(error instanceof Error)) {
      details.push(String(error));
      break;
    }
    const code =
      'code' in error && typeof error.code === 'string'
        ? ` [${error.code}]`
        : '';
    details.push(`${error.name}${code}: ${error.message}`);
    error = error.cause;
  }
  return details.join(' → ');
}
