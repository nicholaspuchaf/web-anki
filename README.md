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
- Template de múltipla escolha: quatro alternativas, uma correta e explicação opcional; seleção e confirmação antes de revelar o gabarito.
- Template padrão ao criar um baralho, aplicado automaticamente aos novos cartões; cada cartão pode usar outro template.
- Backup JSON preserva todo o template; arquivos antigos continuam importáveis.
- Instalação na tela inicial do iPhone e funcionamento offline após carregar o app.

Nos templates básico e LeetCode, todos os versos são opcionais. Você pode salvar somente a pergunta, manter versos em branco para completar depois ou remover todos. Na prévia e na revisão, apenas versos preenchidos aparecem. Cartões sem versos também podem ser avaliados normalmente. Não há execução do código. A importação do enunciado pelo link está disponível no editor LeetCode.

O agendamento é simples, não implementa FSRS ou sincronização com Anki. “De novo” agenda para um minuto; “Difícil” usa ao menos um dia e multiplica o intervalo por 1,2; “Bom” usa ao menos um dia e multiplica por 2,5; “Fácil” usa ao menos quatro dias e multiplica por 3,5. Cartões marcados “De novo” aparecem em uma nova sessão quando vencerem. Não há suporte a `.apkg`.

## Baralho AWS padrão

O site já abre com **AWS · Serviços e aplicações**, um catálogo de **326 cartões**
em 20 categorias, incluindo 45 recursos de Bedrock e AgentCore. Cada cartão tem
**O que é** (explicação curta), **Quando usar** (exemplo simples e bom uso) e
**Visão de pleno** (decisões de arquitetura, limitações e cuidados práticos específicos do serviço), além de
**Visão de sênior** (cenários de falha, fronteiras das garantias, recuperação e trade-offs de produção).
O [índice completo e as fontes](docs/aws-catalog.md) ficam no repositório; o conteúdo
editável está em [src/content/aws-services.json](src/content/aws-services.json).

Esse baralho usa `syncEnabled: false` e IDs reservados que o backend também recusa.
Não é enviado ao DynamoDB, inclusive progresso e favoritos. Ele funciona offline
após o primeiro carregamento e recebe atualizações de conteúdo pelo deploy do site,
preservando as revisões locais por ID. O conteúdo é mantido no JSON; os cartões
incluídos não podem ser editados ou excluídos pela interface.

O template **Básico · vários versos** também pode ser usado em outros baralhos.

## Múltipla escolha

Ao criar um baralho, escolha **Múltipla escolha · 4 alternativas** no campo
**Template padrão dos cartões**. Também é possível selecionar esse template no
editor de qualquer cartão. Preencha a pergunta, as alternativas A a D e marque a
única resposta correta. A explicação é opcional. As alternativas devem estar
preenchidas e ser diferentes; o editor valida antes de salvar ou mostrar a prévia.

Na revisão, selecione uma alternativa e clique em **Confirmar resposta**. O gabarito
e a explicação aparecem após a confirmação; a escolha fica bloqueada para essa
tentativa. Se errar, avance com **De novo**, agendando a próxima revisão para um
minuto. Se acertar, use as avaliações normais de dificuldade. O treino livre também
exige uma escolha confirmada, mas não altera datas nem contagem de revisões.

A prévia é interativa e não grava uma revisão. Os dados são preservados no IndexedDB,
backup JSON e sincronização por cartão. Publique o backend e frontend atualizados
antes de sincronizar: versões anteriores não conhecem os novos campos.

## Arquitetura

Veja [docs/architecture.md](docs/architecture.md) para responsabilidades, dependências e pontos de extensão.

## Preencher LeetCode pelo link

No editor de cartão LeetCode, cole o link do problema e clique em **Preencher pelo
link**. A pergunta recebe o título e o enunciado completo, incluindo exemplos,
restrições e follow-up. Número e dificuldade são preenchidos; os tópicos viram tags
junto das tags que você já criou. Versos, resposta pessoal e solução permanecem
intactos. Se já houver conteúdo, confirme antes de substituir a pergunta.

A importação requer internet e `VITE_API_URL` apontando para o backend atualizado.
Ela consulta apenas dados públicos, sem login ou cookies do LeetCode. Problemas
Premium, limites de consultas e bloqueios do LeetCode mostram um erro e preservam
seus dados. HTML é convertido em texto; imagens são indicadas para consulta no
link original. Os campos continuam editáveis, e importar não salva nem publica o
cartão automaticamente.

## Backup e sincronização

Os cartões ficam no IndexedDB para uso offline. Limpar os dados do site ou o navegador liberar espaço pode remover dados locais. Exporte backups regularmente.

O backend agora armazena um item por flashcard e oferece sincronização incremental
por data, com versões por cartão e exclusões lógicas. A biblioteca remota é pública
e compartilhada: qualquer pessoa pode consultar, editar e excluir cartões.

Com `VITE_API_URL` configurado, clique em **Sincronizar** para receber alterações e
publicar cartões novos, editados e excluídos neste aparelho. Apenas diferenças são
enviadas; não há envio automático ao salvar. Conflitos preservam a alteração local
e permitem escolher **Manter minha alteração** ou **Usar versão da nuvem**.

Versões, exclusões e o ponto de sincronização ficam no IndexedDB. A primeira
sincronização e a primeira após 24 horas fazem uma reconciliação completa; o botão
**Reconciliar biblioteca** permite solicitá-la antes. Baralhos vazios ficam locais.
Backups JSON continuam disponíveis. Veja o [contrato da API](docs/backend-sync.md).

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
