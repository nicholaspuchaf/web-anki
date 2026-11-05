import type { FeedData, FeedSlide } from './model';

const paragraph = (id: string, text: string) => ({
  id,
  type: 'paragraph' as const,
  text,
});
const bullets = (id: string, items: string[]) => ({
  id,
  type: 'bullets' as const,
  items,
});
function slide(
  id: string,
  title: string,
  blocks: FeedSlide['blocks'],
): FeedSlide {
  return { id, title, blocks };
}

export const sampleFeed: FeedData = {
  format: 'folha-feed',
  version: 1,
  progress: [],
  carousels: [
    {
      id: 'feed-composicao',
      revision: 1,
      title: 'Mude o comportamento. Preserve o desenho.',
      scope: 'Composição de objetos e variações de comportamento.',
      objective:
        'Reconhecer quando delegar uma responsabilidade simplifica a evolução do código.',
      tags: ['arquitetura', 'design patterns'],
      intervalDays: 3,
      slides: [
        slide('composicao-1', 'Uma classe para cada combinação?', [
          paragraph(
            'c1',
            'Imagine um exportador de relatórios. Ele pode produzir CSV ou PDF, e cada resultado pode ser enviado por e-mail ou salvo em disco. Uma classe para cada combinação parece simples até aparecerem novos formatos, destinos e regras.',
          ),
          bullets('c2', [
            'A quantidade de combinações cresce mais rápido que a quantidade de capacidades.',
            'Uma mudança em envio não deveria obrigar a revisar toda a geração do relatório.',
            'Procure responsabilidades que variam de forma independente.',
          ]),
        ]),
        slide('composicao-2', 'Troque combinações por colaboradores', [
          paragraph(
            'c3',
            'O exportador recebe um gerador e um destino. Ele coordena a jornada: produzir o conteúdo e entregá-lo. Cada colaborador implementa um contrato pequeno. Um gerador CSV não precisa conhecer um servidor de e-mail.',
          ),
          bullets('c4', [
            'Exportador → Gerador: produzir dados no formato escolhido.',
            'Exportador → Destino: entregar o resultado.',
            'A composição acontece num lugar explícito, perto da inicialização da aplicação.',
          ]),
        ]),
        slide('composicao-3', 'Um algoritmo por contrato', [
          paragraph(
            'c5',
            'Strategy é uma forma de aplicar essa separação quando o que varia é o algoritmo. O contexto delega uma tarefa para um contrato, e a implementação escolhida fornece o comportamento. O mapa abaixo ajuda a localizar cada responsabilidade.',
          ),
          {
            id: 'c6',
            type: 'image',
            src: '/study-assets/design-patterns/strategy-roles.svg',
            alt: 'Mapa autoral dos participantes de Strategy',
            caption: 'Contexto e algoritmo podem evoluir separadamente.',
          },
        ]),
        slide('composicao-4', 'A decisão que importa', [
          paragraph(
            'c7',
            'Não extraia uma interface só porque uma variação talvez apareça no futuro. Observe mudanças reais e a dificuldade dos testes. A separação é útil quando reduz o conhecimento necessário para mudar uma parte sem quebrar as demais.',
          ),
          bullets('c8', [
            'O contrato preserva entradas, resultados e falhas esperadas?',
            'Consigo testar um colaborador sem construir o sistema inteiro?',
            'Uma função recebida como parâmetro já resolveria o problema?',
          ]),
          paragraph(
            'c9',
            'Experimento: escolha uma classe que varia em duas dimensões. Desenhe os colaboradores e compare o que precisaria mudar para adicionar uma opção em apenas uma delas.',
          ),
        ]),
      ],
    },
    {
      id: 'feed-cache',
      revision: 1,
      title: 'Cache rápido. Recuperação pensada.',
      scope: 'Cache de leitura e comportamento durante falhas.',
      objective:
        'Explicar por que expiração e recuperação fazem parte do desenho de um cache.',
      tags: ['sistemas distribuídos', 'performance'],
      intervalDays: 3,
      slides: [
        slide('cache-1', 'Uma resposta pode viajar menos', [
          paragraph(
            'k1',
            'Um cache guarda um resultado para reutilizá-lo. Evitar repetir uma consulta cara reduz trabalho e latência. Mas o resultado guardado representa um momento: entre a gravação e a leitura, a fonte pode mudar.',
          ),
          bullets('k2', [
            'Identifique a fonte de verdade.',
            'Defina quanto atraso o usuário pode aceitar.',
            'Escolha a chave usando todos os fatores que mudam a resposta.',
          ]),
        ]),
        slide('cache-2', 'A chave também separa pessoas', [
          paragraph(
            'k3',
            'Se o resultado depende do cliente, idioma ou permissão, a chave precisa preservar a separação necessária. Reutilizar uma resposta personalizada como se fosse pública pode expor dados. Por outro lado, incluir valores irrelevantes cria muitas entradas sem reaproveitamento.',
          ),
          paragraph(
            'k4',
            'Faça um teste com duas identidades e a mesma URL. Pergunte se elas deveriam receber exatamente o mesmo resultado e se uma revogação de acesso alcança também as cópias guardadas.',
          ),
        ]),
        slide('cache-3', 'E quando tudo expira junto?', [
          paragraph(
            'k5',
            'Depois de uma queda ou expiração concentrada, muitos clientes podem tentar recalcular o mesmo valor. O cache vazio passa a pressionar justamente a fonte que costumava proteger.',
          ),
          bullets('k6', [
            'Espalhe expirações quando isso fizer sentido.',
            'Coordene recomputações concorrentes para a mesma chave.',
            'Limite a carga que pode chegar à fonte.',
            'Teste recuperação com cache frio, não apenas o cenário aquecido.',
          ]),
        ]),
        slide('cache-4', 'Escolha o comportamento de falha', [
          paragraph(
            'k7',
            'Servir um valor antigo pode ser aceitável para um catálogo e inadequado para uma decisão de acesso. A política precisa partir da jornada, e não de um padrão técnico aplicado a tudo.',
          ),
          bullets('k8', [
            'Frescor: quão antiga a resposta pode ser?',
            'Disponibilidade: qual degradação ainda ajuda o usuário?',
            'Recuperação: quanto tempo leva para voltar sem sobrecarregar a fonte?',
          ]),
          paragraph(
            'k9',
            'Experimento: descreva o que seu sistema faria se todas as entradas de uma chave importante sumissem agora. Se a resposta depender de capacidade infinita no banco, o desenho ainda precisa de um limite.',
          ),
        ]),
      ],
    },
  ],
};
