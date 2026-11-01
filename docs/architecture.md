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
