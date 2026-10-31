# Folha

Aplicativo pessoal de flashcards para usar no iPhone, com React, TypeScript, Vite e Bun. React Compiler habilitado; instalação como PWA e armazenamento local no IndexedDB. Sincronização manual opcional com biblioteca pública em Lambda + DynamoDB; backend AWS gerenciado por Terraform; frontend publicado pelo Cloudflare Pages via integração GitHub.

## Executar

Requisitos: Bun 1.4+ e Node.js 22.12+ para as ferramentas do Vite.

```sh
bun install --frozen-lockfile
bun run dev
```

Abra o endereço indicado pelo Vite. O servidor aceita conexões da rede local.
No iPhone, o endereço HTTP pelo IP do Linux permite testar a interface; o modo offline exige HTTPS ou localhost.

```sh
bun test
bun run build
bun run preview
bun run test:e2e
bun run format:check
```

Os testes de navegador requerem Chromium do Playwright (`bunx playwright install chromium`).
O teste E2E usa um build de produção: execute `bun run build` antes dele.

## Qualidade e segurança

O **Lefthook** executa o gate antes de cada `git push`: Trivy, catálogo de pacotes
maliciosos OSV, ESLint, TypeScript, Prettier, testes, Playwright, builds e validação
Terraform. O GitHub Actions repete os checks em cada push.

```sh
bun run setup:checks
bun run prepush
```

Veja [docs/quality.md](docs/quality.md) para os pré-requisitos e limites dos scanners.

## Funcionalidades

- Interface inspirada no LeetCode, com painéis de descrição/revisão lado a lado no desktop e empilhados no celular.
- Temas claro, escuro e automático (acompanha o sistema), com preferência salva no aparelho.

- Template LeetCode com número, dificuldade, link HTTPS e cor personalizável.
- Formatação automática do texto colado: parágrafos compactos, exemplos com entrada/saída, restrições em lista e follow-up destacado. O texto original é preservado.
- Pergunta em um único campo para colar o enunciado do LeetCode com seus exemplos; observações de casos de borda são opcionais.
- Versos independentes: dicas ilimitadas, resposta pessoal, código da solução, complexidade e notas extras.
- Títulos personalizáveis para dicas/notas; tipos de resposta, solução e complexidade já têm nome fixo. Inclusão/exclusão e reordenação de versos, com prévia interativa.
- Revelação progressiva das dicas; escolha direta de qualquer verso sem revelar os demais.
- Linguagem escolhida em lista: Python, JavaScript, TypeScript, Java, C++, C, C#, Go, Rust, Swift, Kotlin, Ruby, PHP, Dart, Scala e SQL. Cada verso de código tem sua própria escolha.
- Código com linguagem, numeração de linhas e cópia; complexidades de tempo/espaço em um verso independente.
- Tags ocultas até o clique; clicar em uma tag da lista aplica o filtro.
- Busca por título, número ou tag; filtros combináveis de dificuldade, tags e favoritos.
- Treino livre dos cartões filtrados, sem alterar o agendamento ou a contagem de revisões.
- Campo de tentativa temporária para raciocinar antes de revelar a resposta (não é salvo).
- Template básico de pergunta/resposta continua disponível, inclusive para cartões antigos.
- Backup JSON preserva todo o template; arquivos antigos continuam importáveis.
- Instalação na tela inicial do iPhone e funcionamento offline após carregar o app.

Todos os versos são opcionais. Você pode salvar somente a pergunta, manter versos em branco para completar depois ou remover todos. Na prévia e na revisão, apenas versos preenchidos aparecem. Cartões sem versos também podem ser avaliados normalmente. Não há execução do código nem busca automática do enunciado no LeetCode.

O agendamento é simples, não implementa FSRS ou sincronização com Anki. “De novo” agenda para um minuto; “Difícil” usa ao menos um dia e multiplica o intervalo por 1,2; “Bom” usa ao menos um dia e multiplica por 2,5; “Fácil” usa ao menos quatro dias e multiplica por 3,5. Cartões marcados “De novo” aparecem em uma nova sessão quando vencerem. Não há suporte a `.apkg`.

## Arquitetura

Veja [docs/architecture.md](docs/architecture.md) para responsabilidades, dependências e pontos de extensão.

## Backup e sincronização

Os cartões ficam no IndexedDB para uso offline. Limpar os dados do site ou o navegador liberar espaço pode remover dados locais. Exporte backups regularmente.

Quando `VITE_API_URL` está configurado, a página inicial oferece **Verificar nuvem**, **Baixar biblioteca** e **Enviar biblioteca**. A biblioteca da nuvem é pública e compartilhada: qualquer pessoa pode ler, editar e excluir os cartões. Somente dados publicados manualmente são enviados à AWS. Não inclua informações privadas.

O envio usa verificação de versão e recusa conflitos, preservando os dados locais. Não há sincronização automática nem mesclagem entre aparelhos. Sem a variável, o app continua funcionando inteiramente local.

## Infraestrutura com Terraform

Veja o [guia de hospedagem híbrida](infra/terraform/README.md) para configurar o backend AWS com Terraform e o frontend pela integração GitHub do Cloudflare Pages. A configuração não usa Cognito nem login. Nenhum recurso foi criado automaticamente.

## Deploy no Cloudflare Pages via GitHub

1. Conecte o repositório GitHub ao Cloudflare Pages e escolha a branch de produção.
2. Configure o build como `bun install --frozen-lockfile && bun run build` e a pasta de saída como `dist`.
3. Configure `BUN_VERSION=1.4.0` e `NODE_VERSION=22.12.0` (ou versão 22 mais recente compatível).
4. Informe a origem HTTPS do Pages em `frontend_origins` no Terraform do backend.
5. Depois de aplicar o backend, obtenha `terraform -chdir=infra/terraform output -raw api_url`.
6. Cadastre essa URL como `VITE_API_URL` nas variáveis de produção do Pages e execute novo deploy.
7. Os próximos pushes para a branch de produção publicam a interface automaticamente.
8. Abra a URL HTTPS no Safari do iPhone e use Compartilhar → Adicionar à Tela de Início.

O primeiro build pode rodar sem `VITE_API_URL`, somente com armazenamento local.
O Terraform não cria nem publica o frontend e não exige credenciais Cloudflare.
As credenciais AWS também não são necessárias no build do Pages. Nenhuma publicação
foi executada automaticamente.
