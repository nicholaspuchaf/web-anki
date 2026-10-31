# Qualidade e segurança antes do push

O projeto usa **Lefthook** (`lefthook.yml`) para executar `bun run prepush` antes do
`git push`. O GitHub Actions repete as verificações no commit recebido, em pushes,
pull requests, execução manual e semanalmente. O workflow não publica recursos.

## Preparação local

Requisitos: Bun 1.4+, Node 24.19+, Terraform 1.10+, Git, tar e Chromium do Playwright.
O instalador de Trivy verificado atualmente suporta Linux x64.

```sh
bun install --frozen-lockfile
bun run setup:checks
```

O `prepare` instala o Lefthook em clones locais; ele não altera hooks em CI ou no
Cloudflare Pages. `setup:checks` instala/verifica o Trivy, prepara o Chromium e
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

Execute manualmente o hook pelo Lefthook com:

```sh
bunx --no-install lefthook run pre-push
```

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
roda após segurança passar. Dependabot propõe atualizações semanais das actions.
A suíte de navegador usa `https://folha-api.example` interceptada pelos testes,
sem acessar a AWS. O runner restaura o build normal ao terminar.

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
versão, nome do arquivo e SHA-256 em `security/tools.json`. Execute novamente
`bun run security:setup`. Não use scripts remotos executados diretamente por pipe.
