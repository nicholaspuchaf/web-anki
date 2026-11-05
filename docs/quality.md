# Qualidade e segurança antes do push

O projeto usa **Lefthook** (`lefthook.yml`) para executar etapas nomeadas em paralelo
antes do `git push`. `bun run prepush` executa o mesmo hook manualmente. O GitHub Actions repete as verificações no commit recebido a cada push. O workflow não publica recursos.

## Preparação local

Requisitos: Bun 1.4+, Node 24.19+, Terraform 1.10+, Git, tar e Chromium do Playwright.
O instalador de Trivy verificado atualmente suporta Linux x64.

```sh
bun install --frozen-lockfile
bun run setup:checks
```

O Lefthook está em `devDependencies`, e seu instalador oficial é autorizado em
`trustedDependencies`. Assim, o Bun instala os hooks ao instalar o pacote em clones
locais; o instalador oficial pula CI. Não há script próprio para instalar o Lefthook. `setup:checks` instala/verifica o Trivy, prepara o Chromium e
inicializa os providers Terraform sem backend. Nenhum plan/apply é executado.
O estado de hooks é local: cada clone precisa instalar o Lefthook.

## Verificações

| Comando                    | O que verifica                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| `bun run lint`             | ESLint, TypeScript e regras React Hooks/Compiler; warnings também falham |
| `bun run typecheck`        | Tipos de aplicação, backend, scripts e testes de navegador               |
| `bun run format:check`     | Prettier sem modificar arquivos                                          |
| `bun test`                 | Regras, persistência, API e comportamento dos scanners                   |
| `bun run check`            | Formatação, lint, tipos, testes, builds e fmt/validate do Terraform      |
| `bun run check:all`        | O mesmo, mais Playwright com API simulada                                |
| `bun run security:setup`   | Instala o release fixado do Trivy e verifica o SHA-256                   |
| `bun run security:malware` | Consulta OSV por pacotes npm conhecidos como maliciosos (`MAL-*`)        |
| `bun run security:trivy`   | Trivy: vulnerabilidades HIGH/CRITICAL e segredos de alta severidade      |
| `bun run prepush`          | Segurança e todas as verificações de qualidade, incluindo navegador      |

As etapas aparecem separadas no terminal: Prettier, ESLint, TypeScript, testes
automatizados, build frontend, build backend, Terraform formatação, Terraform
validação, Trivy, pacotes maliciosos (OSV) e Playwright. `parallel: true` permite
que as verificações independentes rodem simultaneamente; qualquer falha bloqueia
o push. O próprio Playwright gera um build exclusivo em `.cache/playwright-build` ao
iniciar o servidor de testes e depois serve esse diretório. Assim, eles
podem rodar junto do build normal sem disputar a pasta `dist`.

Execute manualmente o hook pelo Lefthook com:

```sh
bunx --no-install lefthook run pre-push --force
```

### Diagnóstico de falhas

`no_tty: true` mantém a saída dos steps no terminal, sem renderização transitória.
`output` inclui explicitamente a saída dos comandos e o resumo de falhas. Cada
step tem `fail_text` com o comando para reproduzir o problema isoladamente, e as
etapas continuam rodando em paralelo.

O OSV informa lote, página e quantidade de pacotes durante a consulta. Falhas
mostram o endpoint e a causa original (timeout, código de rede, status HTTP ou JSON
inválido). O timeout continua sendo 30 segundos por requisição, incluindo a leitura
da resposta; uma consulta incompleta nunca é considerada aprovada.

```sh
bun run security:malware
bunx --no-install lefthook run pre-push --job 'Pacotes maliciosos (OSV)' --force
```

Se houver `LEFTHOOK_OUTPUT` definido no ambiente, ele sobrescreve `output` do YAML.
A [documentação de saída](https://lefthook.dev/configuration/output/) descreve essa
precedência. A mensagem final do Git (`failed to push some refs`) é genérica: o
diagnóstico está no step e no resumo do Lefthook acima dela.

Para corrigir formatação ou problemas de lint automaticamente:

```sh
bun run format
bun run lint:fix
```

O hook não altera arquivos automaticamente: corrija, revise e inclua as mudanças
no commit antes de tentar o push novamente.

## Alcance dos scanners

Trivy lê `bun.lock`, incluindo versões transitivas e de desenvolvimento. Falha com
vulnerabilidades HIGH/CRITICAL, inclusive sem correção disponível; não há ignore
ou exceção para esconder achados. A configuração de segredos exclui diretórios
gerados, arquivos locais `.env` e estado/planos/variáveis Terraform ignorados pelo Git.

Trivy é um scanner de vulnerabilidades, não um antivírus universal. O complemento
OSV consulta nomes/versões do lockfile no catálogo público de pacotes maliciosos.
Ele trata paginação, verifica o formato da resposta e bloqueia o gate ao encontrar
qualquer aviso `MAL-*`. Dependências fora do registro npm que não possam ser
analisadas bloqueiam a verificação para revisão explícita.

Os scanners não garantem detectar ataques ou pacotes maliciosos desconhecidos.
A consulta OSV transmite somente nomes e versões das dependências, não código,
credenciais ou conteúdo dos cartões. Internet é necessária: falhas de consulta ou
de download da base não são consideradas um resultado limpo e bloqueiam o gate.

O executável Trivy tem versão e SHA-256 fixados em `security/tools.json`; o download
usa o release oficial e verifica o checksum antes de executar. Actions do GitHub
estão fixadas por SHA, com permissão somente de leitura e sem credenciais cloud.
A etapa de segurança no CI roda antes de instalar as dependências; a instalação
posterior usa lockfile congelado e ignora lifecycle scripts.

## CI e Cloudflare Pages

`.github/workflows/quality.yml` tem dois jobs: segurança e qualidade. Qualidade só
roda após segurança passar.
A suíte de navegador usa `https://folha-api.example` interceptada pelos testes,
sem acessar a AWS. A suíte gera e serve seu próprio build em `.cache/playwright-build`, sem alterar `dist`.

O workflow GitHub executa **depois** do push; o Lefthook executa **antes**. Hooks
locais podem ser ignorados pelo Git e verificam o diretório de trabalho; configure
os checks `Dependency security` e `Lint, types, tests and builds` como obrigatórios
na proteção da branch para também proteger merges no servidor. A configuração
remota de proteção de branch não é aplicada automaticamente por estes arquivos.

A integração GitHub do Cloudflare Pages continua independente e pode iniciar seu
build antes do término dos checks. Este workflow não transforma o deploy do Pages
em uma etapa dependente do CI.

## Atualizar ferramentas

Atualize as dependências pelo Bun e revise `package.json`/`bun.lock`. Para atualizar
Trivy, obtenha um release oficial confiável, verifique seus checksums e atualize
versão, nome do arquivo e SHA-256 em `security/tools.json`, além do caminho
versionado de `security:trivy` no `package.json`. Execute novamente
`bun run security:setup`. Não use scripts remotos executados diretamente por pipe.

## Dependências versus preparação do ambiente

ESLint, Prettier, TypeScript, Playwright e Lefthook são `devDependencies` instaladas
normalmente pelo `bun install`. Cada execução dos checks usa essas versões locais,
sem reinstalá-las. `bun run hooks:install` é apenas um atalho para `lefthook install`.

Trivy é um executável externo, não uma dependência JS oficial; o script de setup
baixa a versão fixada, confere seu checksum e reutiliza o binário instalado. Chromium
é baixado pelo instalador do próprio Playwright. Terraform é uma ferramenta externa
e seu `init` prepara os providers. Nenhum desses downloads faz parte de cada push.

## Por que ainda existem três arquivos em scripts

Os comandos comuns ficam diretamente no `package.json`, no Lefthook e no workflow.
O Playwright gerencia seu próprio build/preview pelo `playwright.config.ts`. Não há
um runner próprio para lint, testes ou publicação.

Os arquivos restantes têm lógica específica: `install-trivy.ts` verifica o download
e o checksum do binário; `scan-malware.ts` oferece a CLI para a consulta OSV; e
`lib/security.ts` interpreta o lockfile, consulta o catálogo e trata paginação/erros.
Esses arquivos não instalam as dependências JavaScript.
