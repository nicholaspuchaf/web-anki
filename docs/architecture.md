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

`features/sync` contém o cliente HTTP e o estado das ações manuais de verificar, baixar e publicar. A configuração usa uma URL pública de build, sem credenciais de infraestrutura. O usuário confirma operações que substituem bibliotecas. Respostas 409 invalidam a versão remota conhecida e preservam o estado local.

`backend/service.ts` valida o protocolo e reutiliza a validação de backups. O adaptador `backend/handler.ts` persiste um snapshot comprimido no DynamoDB com escrita condicional por revisão. A interface de armazenamento permite testes sem conta AWS. Esta implementação é um primeiro passo limitado a 2 MB brutos/300 KB comprimidos por biblioteca; a evolução para colaboração maior pede registros por entidade e merge.

`infra/terraform` gerencia somente o backend AWS: tabela, Lambda, permissões e logs. Todos acessam uma biblioteca compartilhada, conforme a escolha atual: não existe autenticação ou separação por usuário. CORS é restrição de navegador e não controle de identidade. O frontend é publicado pelo Cloudflare Pages via integração GitHub. A variável de build `VITE_API_URL` recebe a URL da Lambda; `frontend_origins` informa ao backend quais origens podem acessar a API por navegador. Terraform não precisa de provider ou credenciais Cloudflare.
