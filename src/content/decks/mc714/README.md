# Sistemas Distribuidos - MC714

Baralho local baseado nas notas fornecidas pelo usuário, organizado para **P2**.
São **66 flashcards de recuperação ativa** e **7 carrosséis com 66 páginas**. Os
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
