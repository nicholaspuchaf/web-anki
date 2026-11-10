# Administração e histórico de revisões

Abra **Administração** na navegação principal ou no menu flutuante do Feed.
A rota direta é `/#/admin`. A página funciona em desktop/mobile, claro/escuro e
fica disponível offline depois do carregamento inicial.

## Indicadores

- Filtro por baralho, incluindo baralhos antigos que ainda têm histórico.
- Total de cartões atuais, cartões já revisados e pendentes no momento.
- Distribuição dos **intervalos atuais**, não de dias restantes até o vencimento.
  Frações são arredondadas ao dia mais próximo: 1,2 aparece em 1 dia; 2,5 em 3;
  6,25 em 6. As etapas presentes são acrescentadas às referências 1, 3, 5, 7, 14,
  30, 60, 90, 180 e 365 dias. Novos e revisões com intervalo menor que um dia ficam
  em grupos separados. O arredondamento é apenas visual e não altera o scheduler.
- Atividade dos últimos 30 **dias de calendário locais**, incluindo hoje, com
  zero nos dias sem atividade.
- Alternância entre cartões únicos por dia e quantidade de avaliações. Um mesmo
  cartão avaliado três vezes no dia conta como um cartão e três revisões.
- Coluna **Sem data** sempre à esquerda. É um acumulado anterior, com escala
  própria e cor distinta para não achatar os valores diários. Os números são
  exatos e a diferença de escala é indicada abaixo do gráfico.
- Clique/toque em uma coluna para detalhar o dia, os registros antigos ou um grupo
  de intervalos. As tabelas mostram até 20 registros/cartões por seleção.

“De novo” também conta como avaliação. Treino livre não registra uma revisão
agendada e continua sem modificar datas, intervalos ou contadores.

## Migração sem perder progresso

Os contadores `Card.reviews` anteriores são recuperados como revisões **sem data**.
Não se estima a data usando `due`, o intervalo ou a data da atualização. Um cartão
com cinco revisões anteriores contribui com cinco avaliações sem data e um cartão
único nesse grupo.

A recuperação é idempotente: abrir/recarregar a página não duplica contagens.
Importações ou sincronizações que tragam contadores maiores, sem datas disponíveis,
acrescentam apenas a diferença ainda desconhecida a esse grupo. Reduzir um contador,
restaurar um backup antigo ou excluir um cartão não apaga registros já conhecidos.
Antes da primeira gravação após atualizar o aplicativo, ou ao abrir o dashboard,
a recuperação considera os cartões existentes; cartões removidos antes desta
feature não podem ser reconstruídos a partir de dados que já não existem.

O histórico mantém o baralho associado ao registro antigo/avaliação. Mover o cartão
para outro baralho não reescreve suas avaliações passadas. Cartões removidos ainda
contribuem ao histórico; suas linhas mostram “Cartão removido da biblioteca”.

## Gravação local e segurança contra falhas

`review-history/model.ts` contém a recuperação e agregações puras. Ao avaliar um
cartão, `use-review.ts` cria um evento com UUID, ID do cartão/baralho, horário,
avaliação, número da revisão e intervalos anterior/posterior. O horário utilizado
é o mesmo fornecido ao scheduler.

`writeLibrary` grava progresso e evento **na mesma transação IndexedDB**, no store
`library` de `folha`. As chaves são `review-history:meta:v1` e
`review-history:event:<UUID>`. A versão do banco e os campos dos cartões permanecem
compatíveis. O commit de sincronização também recupera contadores antigos, mas não
inventa eventos datados para revisões recebidas sem data de outro aparelho.

Depois do commit, os dados são copiados ao localStorage:

- `folha:review-history:v1:meta` guarda contagens antigas, totais e nomes de baralhos;
- `folha:review-history:v1:event:<UUID>` guarda cada avaliação datada.

Se a cópia falhar por quota ou bloqueio do localStorage, o progresso e a data
continuam preservados no IndexedDB. O dashboard informa a falha e recompõe a cópia
quando consegue gravar novamente. Conflitos de progresso, eventos inválidos e IDs
de evento duplicados não criam registros extras nem avançam a fila de revisão.

O dashboard lê uma fotografia consistente do histórico e da biblioteca, atualiza
na navegação, ao voltar o foco e após alterações em outras abas. A proteção contra
cliques simultâneos complementa a verificação de concorrência do repositório.

Não há alterações de intervalos, novos limites diários, integração de histórico
com DynamoDB ou envio de datas de revisão à nuvem. O backup atual de flashcards
continua preservando o progresso dos cartões, mas não exporta esse histórico separado.
Apagar todos os dados locais do site remove também as avaliações deste aparelho.

## Tempo de estudo

A Administração mostra o tempo ativo diário dos últimos 30 dias e uma tabela pesquisável e paginada por flashcard, respeitando o filtro de baralho. Cada linha apresenta tempo total, número de passagens cronometradas e média por passagem. Cartões sem medição anterior ficam fora do denominador: não é possível recuperar os tempos dos cronômetros que antes existiam somente em memória.

O tempo inclui revisão e treino livre, mesmo se o usuário sair sem avaliar o cartão. Isso é diferente da quantidade de avaliações do gráfico de revisões, que continua excluindo treino livre. Uma passagem identifica a apresentação de um cartão dentro de uma sessão; pausar e retornar ao mesmo cartão não cria outra passagem. Começar uma sessão nova cria uma nova passagem. As médias consideram somente o tempo dentro da janela ou dia selecionado.

`features/study-time` concentra o modelo de agregação, armazenamento e painel. `use-study-timers` grava checkpoints cumulativos por passagem/dia em chaves `folha:study-time:v1:<UUID>:<dia-local>`. O mesmo checkpoint é sobrescrito; abas têm UUIDs independentes, evitando sobrescrever a atividade umas das outras. Trechos que cruzam meia-noite são divididos pelos dias locais. O tempo usa relógio monotônico, pausa com aba oculta/fora da revisão e é atualizado aproximadamente a cada segundo, ao pausar, trocar de cartão ou sair da página.

Os registros persistem no localStorage, separados de cartões, eventos de avaliação e da sincronização DynamoDB. Não entram nos backups de flashcards. Uma falha de quota é avisada; checkpoints pendentes ficam na memória da aba para nova tentativa. Fechar a aba antes de resolver a falha pode perder essa parte ainda não persistida. Registros inválidos são sinalizados e ignorados, sem modificar o histórico de revisões. O painel acompanha eventos de armazenamento de outras abas.
