# Arquitetura

O projeto usa módulos por funcionalidade, com regras puras separadas de React e IndexedDB. A estrutura é intencionalmente pequena: não há contêiner de injeção, biblioteca global de estado ou backend antes de existir necessidade.

```text
src/
  app/                   Composição das telas, navegação e layout global
  features/
    library/
      model.ts           Tipos de baralho, cartão e biblioteca
      commands.ts        Transformações imutáveis para criar/editar/excluir
      selectors.ts       Consultas reutilizáveis da biblioteca
      hooks/             Carregamento, salvamento e estado de erros
      components/        Biblioteca, baralho e formulário de edição
    leetcode/
      model.ts           Metadados, tipos de verso e validação do template
      components/        Editor de versos, cartão interativo, código e tags
    review/
      scheduler.ts       Regra pura de agendamento
      use-review.ts      Estado e ações da sessão de revisão
      ReviewPage.tsx     Apresentação da sessão
    backup/
      parse-backup.ts    Validação e normalização de dados externos
      use-backup.ts      Importação/exportação e mensagens ao usuário
  shared/
    hooks/               Conectividade e relógio
    storage/             Adaptador IndexedDB
    ui/                  Button, TextField, Modal e Alert
```

## Fluxo de dados

O `App` compõe a navegação e os hooks de funcionalidades. `useLibrary` carrega o banco e persiste mudanças antes de atualizar a interface; falhas mantêm o estado anterior e exibem erro. Uma trava impede gravações simultâneas nesta instância.

Comandos de biblioteca retornam um novo estado, sem acessar React, relógio, banco ou rede. O agendador recebe explicitamente o instante de referência para permitir testes determinísticos. A seleção de cartões vencidos é compartilhada entre a listagem e a sessão de revisão.

O repositório encapsula acesso e versão do IndexedDB. Seu formato atual guarda uma biblioteca por chave. `Library.version` versiona o formato do backup, independentemente da versão do banco.

A UI compartilhada não conhece cartões, baralhos ou armazenamento. Componentes de funcionalidade podem conhecer modelos e comandos do seu domínio. Os testes ficam junto às regras e aos adaptadores; `e2e/` verifica fluxos reais de usuário sobre o build de produção.

## Evolução

- Para alterar o agendamento, substitua `scheduler.ts`, preserve o contrato e amplie os testes com cenários de aprendizagem.
- Para novas telas, crie componentes na funcionalidade responsável e conecte a navegação em `app/`. Adote um roteador quando houver necessidade de URLs por tela.
- Para sincronização remota, crie uma camada explícita de sincronização, identidade e resolução de conflitos. Trocar apenas o adaptador local não resolve esses problemas.
- Para migrações, acrescente uma etapa no upgrade do banco e um conversor versionado do backup, mantendo os testes de compatibilidade.
- Para grandes bibliotecas, migre de um registro único para stores de cartões/baralhos com índices e operações por entidade.

A primeira versão não coordena edições concorrentes entre abas, não sincroniza dispositivos e mantém todas as entidades em memória. Essas limitações devem ser resolvidas quando os fluxos correspondentes forem adicionados.

## Template de LeetCode

`Card.leetcode` é opcional; sua ausência mantém o comportamento do cartão básico. A extensão contém metadados e uma lista ordenada de versos com ids estáveis. Cada verso tem tipo, título e conteúdo próprios; código inclui linguagem. A resposta pessoal é um verso do tipo `answer`.

O mesmo `LeetCodeCard` é usado na prévia do editor, na consulta do baralho e na revisão. Somente o verso escolhido é renderizado. Dicas podem ser reveladas sequencialmente ou selecionadas individualmente. Tags começam ocultas para evitar pistas involuntárias.

A validação `parseLeetCode` é compartilhada entre comandos de gravação e importação de backups. Os novos campos são opcionais no formato de biblioteca existente: backups antigos permanecem válidos; o novo leitor preserva metadados, versos e favoritos. Uma versão antiga do app não conhece esses campos e não deve ser usada para restaurar um novo backup.

Filtros são funções puras em `library/filter-cards.ts`; a sessão recebe uma seleção explícita de ids. O modo de treino consome a fila em memória e não grava revisões ou datas. O rascunho de tentativa pertence ao cartão renderizado e é descartado ao trocar de cartão.

Exemplos fazem parte do texto da pergunta. O formato anterior com exemplos separados é convertido durante leitura/importação: os exemplos são anexados à pergunta e os campos antigos de tempo/espaço viram um verso `complexity`. A conversão é idempotente; salvar/exportar usa o formato normalizado. Resposta, solução e complexidade não pedem título duplicado; dicas e notas permitem títulos próprios.

`parse-description.ts` interpreta o enunciado exclusivamente para apresentação, sem modificar a pergunta armazenada. O componente `ProblemDescription` renderiza texto seguro como parágrafos, exemplos, restrições e follow-up, sem HTML arbitrário. A lista de linguagens fica centralizada em `leetcode/languages.ts`; `SelectField` é reutilizável e permite preservar linguagens antigas sem disponibilizar entrada livre em novos versos.

## Aparência e versos opcionais

Os componentes compartilham tokens de cor semânticos em `style.css`; os temas substituem as variáveis, sem duplicar estilos de telas. `features/theme` controla a preferência local e acompanha alterações de tema do sistema ou de outras abas. A inicialização ocorre antes de montar a aplicação.

Todos os versos são opcionais, inclusive títulos personalizados e o verso básico. Conteúdo em branco é preservado para edição futura; `getAvailableFaces` centraliza quais versos aparecem na leitura. A validação continua exigindo os tipos corretos e ids únicos, mas aceita listas vazias. Uma sessão sem respostas disponíveis permite avaliação direta, evitando bloquear a revisão.

## Sincronização pública opcional

`features/sync/api.ts` valida o contrato HTTP por cartão. `model.ts` compara conteúdo,
mescla por ID/versão e resolve conflitos; `engine.ts` coordena páginas, envios e
reconciliação. `use-cloud-sync.ts` conecta o motor à interface. A configuração usa
uma URL pública de build, sem credenciais de infraestrutura. Não há polling nem
envio automático ao editar: os botões iniciam sincronização nos dois sentidos.

A primeira sincronização lê todos os cartões; as próximas consultam desde o último
checkpoint, com reconciliação completa a cada 24 horas de uso ou sob demanda.
Respostas antigas não substituem versões mais recentes. Conflitos preservam a
edição local e ficam persistidos até a escolha explícita do usuário. Cada envio
aceito atualiza a referência remota sem apagar edições feitas durante o pedido.

O repositório IndexedDB mantém a biblioteca na chave existente `current` e os
metadados por URL da API em uma chave separada, no mesmo object store. Dados e
checkpoint são gravados na mesma transação, após todas as páginas. Uma revisão
local protege contra alterações concorrentes entre abas. Gravações normais também
verificam se a biblioteca de origem continua atual. Backups mantêm o formato v1;
versões remotas e checkpoints pertencem ao aparelho, não ao backup.

`backend/model.ts` define registros, limites e validação reutilizando o parser de
backups. `backend/service.ts` implementa HTTP e conflitos por versão.
`backend/sync.ts` valida os intervalos e cursores de paginação.
`backend/store.ts` encapsula GetItem/PutItem condicionais e Query no índice por data;
`backend/handler.ts` somente conecta o SDK e a configuração de ambiente.
Os testes cobrem o protocolo e os comandos do adaptador sem uma conta AWS.

Cada cartão inclui o nome/ID de seu baralho para permitir reconstrução local;
baralhos vazios não têm registro remoto. Exclusões viram tombstones sem TTL.
O servidor define `last_updated_at`; datas locais e confirmações de envio não
avançam o checkpoint.
A sincronização sobrepõe dois minutos e fornece `last_sync_at` somente ao final das
páginas. A consistência eventual do índice exige reconciliação periódica pelo
cliente. Consulte o [contrato e limitações](backend-sync.md).

`infra/terraform` gerencia somente o backend AWS: tabela, Lambda, permissões e logs. Todos acessam uma biblioteca compartilhada, conforme a escolha atual: não existe autenticação ou separação por usuário. CORS é restrição de navegador e não controle de identidade. O frontend é publicado pelo Cloudflare Pages via integração GitHub. A variável de build `VITE_API_URL` recebe a URL da Lambda; `frontend_origins` informa ao backend quais origens podem acessar a API por navegador. Terraform não precisa de provider ou credenciais Cloudflare.

## Importação de enunciado LeetCode

`leetcode/problem-url.ts` valida links e o contrato de metadados compartilhado entre
browser e backend. `backend/leetcode.ts` encapsula consulta pública, limites,
cache temporário e erros recuperáveis; `service.ts` expõe a rota GET.
`leetcode/import-problem.ts` chama essa rota e converte HTML em texto usando um
fragmento inerte, descartando conteúdo ativo. O editor aplica o resultado somente
após concluir a consulta e preserva versos e tags personalizadas. Uma falha mantém
o rascunho anterior. Não há sessão LeetCode, scraping de área autenticada ou novo
recurso Terraform. Testes de navegador usam o handler real com transporte upstream
simulado; uma consulta real ao problema Two Sum também validou o adaptador.

## Template de múltipla escolha

`Card.multipleChoice` é uma extensão opcional com `options` (tupla de quatro textos),
`correctIndex` (0 a 3) e `explanation` (texto opcional, representado por string vazia).
`multiple-choice/model.ts` centraliza criação e validação, utilizada tanto pelos
comandos de gravação quanto pelo parser de backup compartilhado com o backend.
Um cartão não pode conter simultaneamente `leetcode` e `multipleChoice`.

`Deck.defaultTemplate` é opcional e aceita `basic`, `leetcode` ou `multiple-choice`.
O editor de novos cartões usa essa preferência; cartões existentes continuam
usando seu próprio template, e baralhos antigos mantêm o padrão LeetCode ao criar.
O parser preserva o campo no backup e na API sem mudar o formato Library v1.

`MultipleChoiceFields` edita alternativas e gabarito. `MultipleChoiceCard` mantém a
tentativa apenas em memória e notifica a revisão depois da confirmação.
`CardPreview` seleciona o componente apropriado para a prévia do editor e do
baralho. A revisão só libera avaliação após responder; erros usam obrigatoriamente
`again`. Treino livre não grava a tentativa. Trocar de cartão reinicia a seleção.
O comparador de conflitos mostra alternativas, gabarito e explicação para permitir
uma escolha informada entre a edição local e a remota.

As extensões são aditivas: backups antigos continuam legíveis. Clientes antigos
não conhecem múltipla escolha e podem descartar esses campos; frontend e backend
precisam ser publicados juntos para preservar o novo template na nuvem.

## Baralhos incluídos no repositório

`content/aws-services.json` contém o catálogo de estudo, sem estado de revisão.
`bundled-decks/aws.ts` converte-o em cartões com IDs estáveis, quatro versos e
`syncEnabled: false`. `withBundledAwsDeck` atualiza apenas o conteúdo reservado e
preserva agendamento, revisões, favoritos e todos os cartões pessoais.
`bootstrap.ts` aplica essa composição a bibliotecas novas ou existentes usando
comparação de estado para não sobrescrever uma alteração concorrente.

`useLibrary` aplica o catálogo ao abrir, salvar ou restaurar. O repositório IndexedDB
continua genérico; não depende de um conteúdo específico. Os cartões e o baralho
reservados não são excluídos pela interface. A autoria acontece no JSON; não há
consulta de catálogo nem provisionamento de recursos AWS durante o estudo.

`standard/model.ts` valida `Card.faces`, versos genéricos independentes de LeetCode.
`StandardCard` é compartilhado por prévia e revisão. `Card.tags` e `sourceUrl`
permitem categorizar o material e consultar sua fonte. O template `multi-face`
permite criar outros cartões com esse formato, mantendo versos opcionais.

`library/sync-policy.ts` centraliza a exclusão de dados locais. Ela filtra pendências,
ignora atualizações/tombstones remotos que atingiriam conteúdo local e remove
metadados de conflito incompatíveis. O cliente HTTP bloqueia envios diretos; o
backend recusa os IDs reservados antes de GetItem/PutItem e recusa payloads com
`syncEnabled: false`. O módulo de IDs é separado do catálogo para que a Lambda não
inclua os 326 cartões no pacote de execução.

O catálogo e seus limites são validados em testes, assim como atualização sem
perda de progresso, preservação de bibliotecas existentes e zero chamadas DynamoDB
em pedidos com IDs reservados. O teste de navegador confirma carregamento automático,
quatro versos, limite visual das definições, ausência de envio e uso offline.

## Composição de catálogos e imagens de estudo

`bundled-decks/catalog.ts` compõe AWS e Design Patterns na abertura, gravação e
restauração. `merge.ts` atualiza somente os IDs e o deck do catálogo aplicado,
preservando os outros baralhos, cartões pessoais e estado de revisão. A relação
entre IDs de deck e prefixos fica em `ids.ts`, sem importar conteúdo na Lambda.
`bundledDeckReviewedAt` fornece a data correspondente ao catálogo da tela.

`content/design-patterns.json` contém 22 padrões com oito perguntas cada. O conteúdo
é uma síntese original; o índice e a matriz editorial ficam em
`docs/design-patterns`. `design-pattern-assets.json` rastreia as dez ilustrações
permitidas pelo fornecedor; 22 mapas SVG autorais complementam o material.

`Card.frontImage` e `StudyFace.image` usam `StudyImage`, com caminho local, texto
alternativo, legenda e crédito, além de link de fonte opcional. O parser aceita
somente caminhos sob `/study-assets/` com extensão de imagem e links HTTPS sem
credenciais, rejeitando caminhos relativos, protocolos executáveis e imagens remotas.
`StudyIllustration` é compartilhado pela pergunta e pelos versos e permite ampliar
o arquivo local. Versos contendo apenas imagem também podem ser revelados.

Backups preservam os metadados visuais; eles não incorporam os bytes das imagens.
Os recursos incluídos são distribuídos pela aplicação e precacheados pela PWA.
O teste de navegador consulta todos os 32 recursos sem rede e verifica revisão,
favoritos, créditos, ocultação dos versos e convivência com o baralho AWS.
