# Sistemas Distribuidos - MC714

Novo baralho local de **218 flashcards**, elaborado com a skill `criar-otimizar-flashcards`. Abrange os conceitos dos **228 flashcards** e das **66 páginas dos sete carrosséis** do baralho anterior, incluindo explicações e ressalvas. A quantidade resulta da revisão de escopo e redundância, não de uma meta de volume.

Cada cartão possui uma pergunta autossuficiente, uma resposta principal curta e um verso opcional **Entenda o raciocínio**. Fórmulas e exemplos numéricos conservam suas hipóteses: dependências sequenciais em `N × RTT`, unidades decimais em volume de tráfego e fronteiras corretas nas medições de latência. Não se trata de ampliar a ementa além do material existente.

## Organização e cobertura

Os 21 arquivos de `flashcards/` seguem os assuntos do acervo anterior:

- X Window System, papéis cliente/servidor, WANs e dependências de RTT.
- Interfaces remotas, VNC/thin clients, web, cloud gaming e distribuição do processamento.
- Métricas de experiência, energia, responsividade, qualidade visual e decisões arquiteturais.
- Navegadores multiprocesso, isolamento, IPC, pipeline gráfico, JavaScript assíncrono, Workers e JIT.
- Transparência, middleware, RPC/stubs, proxies, cache, mobilidade e recuperação.
- Idempotência, deduplicação, consistência, garantias de sessão e CAP.
- Stateless/stateful, escalabilidade, sessões, cookies/JWT e estado compartilhado.
- Balanceamento L4/L7, TCP handoff, terminação TCP/TLS, HTTP/2, afinidade, gargalos, DSR e hierarquias.

[coverage.json](coverage.json) associa **cada ID antigo** aos cartões que agora avaliam seu conhecimento; registra também o destino de cada página dos carrosséis. Os cartões novos incluem `sourceCardIds` para rastreabilidade editorial. Essa informação não é histórico de estudo nem copia agendamento.

Na classificação por cartão de origem, 102 foram mantidos, 93 reformulados, 22 consolidados com outros e 11 tiveram seu conteúdo dividido entre alvos mais específicos. Isso não é uma soma dos cartões finais: um destino pode representar mais de uma origem. Três novos alvos explicitam assuntos das páginas de carrossel sobre percentis e escolha de métricas. A matriz verifica referências e cobertura estrutural; a equivalência conceitual foi revisada editorialmente.

## Coexistência e progresso

O baralho anterior agora se chama **Sistemas Distribuidos - MC714 (antigo)**. Mantém `builtin-mc714`, seus 228 cartões, sete carrosséis, cartões pessoais, favoritos e agendamentos. O novo usa `builtin-sd-mc714` e prefixo independente, evitando que um catálogo sobrescreva o outro. Os cartões novos começam sem revisões porque esta é uma coleção nova; o progresso antigo continua no acervo antigo.

Ambos podem ser ativados ou desativados separadamente em Configurações. Não há desativação automática nem cópia do progresso entre versões. Os sete carrosséis permanecem na pasta e no baralho antigos; `carousels/` do novo está reservado para conteúdo futuro.

As tags obrigatórias continuam sendo `sistemas-distribuidos`, `unicamp`, `mc714` e exatamente uma avaliação entre `p1`, `p2`, `p3` (neste conteúdo, `p2`), além das tags de cada assunto. O baralho permanece no repositório, funciona offline e usa `syncEnabled: false`; não é enviado ao DynamoDB.

## Fontes

O material principal é o [acervo MC714 anterior](../mc714/README.md), construído a partir dos textos e notas fornecidos pelo usuário. As referências técnicas já utilizadas estão documentadas ali. A reformulação preserva condições e distinções, incluindo assinatura versus criptografia, encaminhamento versus handoff, reconexão versus recuperação de operações e afinidade versus replicação.
