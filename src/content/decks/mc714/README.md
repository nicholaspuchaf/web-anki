# Sistemas Distribuidos - MC714 (antigo)

Este é o acervo original, preservado com seus IDs e progresso. O novo baralho
[Sistemas Distribuidos - MC714](../mc714-revisao/README.md) contém a revisão
pedagógica de seu conteúdo e tem progresso independente.

Baralho local baseado nas notas fornecidas pelo usuário, organizado para **P2**.
São **228 flashcards de recuperação ativa** e **7 carrosséis com 66 páginas**. Os
flashcards têm uma resposta direta e um verso de justificativa/atenção. Os
carrosséis desenvolvem explicações, percursos, contas e exercícios; não há cópia
integral de uma fonte externa. Três diagramas SVG são autorais e ficam em
`public/study-assets/mc714/`.

| Arquivo por formato         | Páginas | Flashcards | Cobertura                                                                                                    |
| --------------------------- | ------: | ---------: | ------------------------------------------------------------------------------------------------------------ |
| `x-window.json`             |       8 |          8 | Papéis, inversão aparente, dispositivos, pedidos, eventos e separação aplicação/apresentação                 |
| `x-wan.json`                |       8 |          8 | RTT, banda, dependências sequenciais, LAN/WAN, 5 e 500 ms, assincronia e imagens                             |
| `interfaces-remotas.json`   |      10 |         10 | X, VNC/RFB, thin clients híbridos, web, renderização, tráfego, transparência, compatibilidade e cenários     |
| `cloud-gaming.json`         |      10 |         10 | Pipeline, input-to-photon, 70 ms, bitrate, 9 GB/h, 50/500 Mbps, adaptação e gargalos                         |
| `aplicacoes-web.json`       |       8 |          8 | Interação local/remota, fórmulas, confirmação de salvamento, dados, cache, CDN, escala e offline             |
| `metricas-qoe.json`         |      12 |         12 | Throughput, latência, RTT, jitter, perdas, FPS/frame time, INP, carregamento, imagem, energia e continuidade |
| `escolha-arquitetural.json` |      10 |         10 | Custos por sessão, CPU/GPU, bateria, heterogeneidade, adaptações, matriz de decisão e argumentação           |

## Ampliação — questões 3 e 4

O material de `gerarFlashs.txt` acrescenta **66 flashcards**, sem alterar os
carrosséis ou os 66 flashcards anteriores. Cada cartão mantém uma pergunta,
resposta direta e justificativa/atenção; exemplos incluem saída de código e
situações de falha/consistência. O arquivo de entrada permanece preservado.

| Arquivo em `flashcards/`          | Novos cartões | Cobertura                                                                                                   |
| --------------------------------- | ------------: | ----------------------------------------------------------------------------------------------------------- |
| `navegadores-processos.json`      |            12 | Isolamento de falhas/memória, SOP, sandbox, multicore, RAM, IPC, threads e pipeline gráfico                 |
| `javascript-concorrencia.json`    |            16 | Event Loop, timers, fetch, Promises/microtarefas, CPU-bound, async, Workers, transferência de dados e JIT   |
| `transparencia-middleware.json`   |            12 | Localização, migração, replicação, stubs/RPC, descoberta, proxies, cache e limites das abstrações           |
| `mobilidade-recuperacao.json`     |            10 | Wi-Fi/celular, reconexão, escolha de réplica, sessão, timeout incerto, idempotência e deduplicação          |
| `consistencia-transparencia.json` |            16 | Linearizabilidade, RYW, Monotonic Reads, consistência eventual, CAP, falhas parciais e transparência segura |

Além das tags fixas, cada cartão usa tags específicas como `ipc`, `sandbox`,
`event-loop`, `workers`, `jit`, `reconexao`, `deduplicacao`, `linearizabilidade`,
`read-your-writes`, `monotonic-reads` e `cap`. A revisão dessa ampliação é de
2026-11-06. Questões de consistência explicitam condições importantes, como ausência
de outra escrita no exemplo de Read Your Writes e sobreposição temporal no exemplo
de linearizabilidade.

Fontes de apoio às distinções de implementação, além do texto de entrada:

- [Arquitetura multiprocesso — Chrome](https://developer.chrome.com/blog/inside-browser-part1).
- [Pipeline de renderização — Chrome](https://developer.chrome.com/blog/inside-browser-part3).
- [Event Loops — HTML Standard](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops).
- [Compilação otimizadora — V8](https://v8.dev/docs/turbofan).
- [Consistência eventual e garantias de sessão — Werner Vogels](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html).
- [CAP — artigo de Gilbert e Lynch](https://cs.nyu.edu/~apanda/classes/sp25/papers/gilbert02brewers.pdf).

## Questão 5 — Stateless, Stateful e estado de sessão

O texto fornecido acrescenta **36 flashcards**, todos com `p2`, `arquiteturas`,
`sistemas distribuidos` (grafia solicitada) e a tag padrão `sistemas-distribuidos`,
além de `unicamp`, `mc714`, `questao-5` e tags específicas por cartão. Os carrosséis
permanecem com 66 páginas; os 132 flashcards anteriores mantêm IDs e conteúdo.

| Arquivo em `flashcards/`      | Novos cartões | Cobertura                                                                                                    |
| ----------------------------- | ------------: | ------------------------------------------------------------------------------------------------------------ |
| `stateless-stateful.json`     |            10 | Fronteira de estado, sessões, dados de negócio, memória volátil, transações e usos de estado local           |
| `escalabilidade-sessoes.json` |             8 | Scale-out, balanceamento, Round Robin/Least Connections, autoscaling, sticky sessions e falhas               |
| `tokens-jwt.json`             |            10 | Cookies, claims, validação, assinatura/confidencialidade, revogação, roubo, desatualização e custo de tokens |
| `estado-compartilhado.json`   |             8 | Sessão por identificador, Redis, latência, gargalos, disponibilidade, consistência e critérios de escolha    |

As respostas distinguem falha de instância de resultado de uma operação em voo,
assinatura de criptografia e afinidade de replicação. Revogação central e recuperação
com Redis dependem da estratégia real, em vez de serem garantias automáticas.
O texto fornecido é a fonte principal; as distinções sobre JWT foram verificadas na
[RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) e nas
[boas práticas da RFC 8725](https://www.rfc-editor.org/rfc/rfc8725).

## Tags obrigatórias

O manifesto `deck.json` define a regra: `sistemas-distribuidos`, `unicamp` e `mc714`,
mais **exatamente uma** entre `p1`, `p2` e `p3`. Este conteúdo usa `p2`. Tags são
armazenadas em minúsculas; `P2` é normalizado para `p2`.

A regra é aplicada a flashcards e carrosséis na validação, gravação e restauração
de backups. Tags obrigatórias ausentes são acrescentadas; ausência de avaliação
usa `p2`; avaliações múltiplas são recusadas. O editor mostra as tags fixas,
permite escolher a avaliação e adicionar tags livres. Cartões pessoais com IDs
próprios são preservados ao atualizar o catálogo local, inclusive em P1 e P3.

## Notas de precisão

- O X admite requisições assíncronas; `N × RTT` é uma aproximação para N dependências
  sequenciais, não para toda operação gráfica.
- VNC/RFB pode enviar regiões modificadas do framebuffer; não é sinônimo de vídeo
  contínuo nem de toda solução thin client.
- A conta de 70 ms é ilustrativa; os trechos de rede não devem ser somados de novo
  como um RTT adicional. O consumo de 9 GB/h usa Mbps/GB decimais e exclui overhead.
- INP mede resposta até a próxima pintura de interações qualificadas, não garante
  a conclusão de um salvamento remoto. A média de FPS não descreve toda a fluidez.
- Custos e energia são condicionais: hardware, carga, qualidade e rede precisam
  ser comparáveis. A hospedagem remota não exige necessariamente uma GPU física
  exclusiva por sessão.

As notas do usuário são a fonte principal. Referências primárias de apoio para
as distinções de protocolo e medição:

- [Comunicação no X.org](https://www.x.org/guide/communication/) e
  [protocolo X11](https://xorg.freedesktop.org/releases/current/doc/xproto/x11protocol.html).
- [RFC 6143 — Remote Framebuffer Protocol](https://datatracker.ietf.org/doc/html/rfc6143).
- [Interaction to Next Paint — web.dev](https://web.dev/articles/inp).

Os dados estão divididos entre `flashcards/` e `carousels/`; os índices agregam os
sete arquivos de cada formato. IDs são estáveis. `syncEnabled: false`, a política
de sincronização e a reserva `builtin-mc714*` mantêm este conteúdo fora do DynamoDB.

## Questão 6 — Despacho e balanceamento de carga

60 novos flashcards de revisão, com resposta curta e verso de explicação, divididos em cinco arquivos de 12 cartões:

- `despacho-l4-l7.json`: cluster em três camadas, campos de transporte, algoritmos e roteamento por conteúdo.
- `tcp-handoff.json`: transferência de conexão, estado TCP, buffers, opções e distinção de DSR.
- `proxy-l7-tls.json`: terminação TCP/TLS, passthrough, proxy reverso e limites de um handoff HTTPS/HTTP2 especializado.
- `afinidade-gargalos.json`: afinidade de conexão e sessão, NAT, mobilidade, health checks, capacidade e SPOF.
- `retorno-direto-hierarquia.json`: assimetria, cálculos em unidades decimais, retorno direto, distribuição global/local e failover.

Todos recebem `sistemas-distribuidos`, `p2`, `Load Balancer`, `unicamp`, `mc714`, `balanceamento-de-carga`, `questao-6` e tags específicas. O aplicativo normaliza `Load Balancer` para `load balancer`, mantendo a mesma tag para busca e filtros. O conteúdo é instalado automaticamente e permanece local, fora do DynamoDB. Os 168 cartões anteriores mantêm IDs e progresso.

O material fornecido pelo usuário é a base pedagógica. Os detalhes de estado dos protocolos foram conferidos em fontes primárias:

- [RFC 9293, seção 3.3.1 — estado TCP e TCB](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.3.1).
- [RFC 8446, seção 5.3 — contadores de registros TLS](https://www.rfc-editor.org/rfc/rfc8446.html#section-5.3).
- [RFC 9113, seção 5 — streams e estado de conexão HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html#section-5).

Handoff de uma conexão ativa não é apresentado como uma operação universal desses protocolos. Nos exemplos de volume de dados, KB/MB/GB são decimais e o payload é separado do custo adicional dos pacotes.
