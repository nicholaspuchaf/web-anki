import part0 from './x-window.json' with { type: 'json' };
import part1 from './x-wan.json' with { type: 'json' };
import part2 from './interfaces-remotas.json' with { type: 'json' };
import part3 from './cloud-gaming.json' with { type: 'json' };
import part4 from './aplicacoes-web.json' with { type: 'json' };
import part5 from './metricas-qoe.json' with { type: 'json' };
import part6 from './escolha-arquitetural.json' with { type: 'json' };
import extra0 from './navegadores-processos.json' with { type: 'json' };
import extra1 from './javascript-concorrencia.json' with { type: 'json' };
import extra2 from './transparencia-middleware.json' with { type: 'json' };
import extra3 from './mobilidade-recuperacao.json' with { type: 'json' };
import extra4 from './consistencia-transparencia.json' with { type: 'json' };
import q5part0 from './stateless-stateful.json' with { type: 'json' };
import q5part1 from './escalabilidade-sessoes.json' with { type: 'json' };
import q5part2 from './tokens-jwt.json' with { type: 'json' };
import q5part3 from './estado-compartilhado.json' with { type: 'json' };
export default {
  ...part0,
  reviewedAt: '2026-11-08',
  cards: [
    ...part0.cards,
    ...part1.cards,
    ...part2.cards,
    ...part3.cards,
    ...part4.cards,
    ...part5.cards,
    ...part6.cards,
    ...extra0.cards,
    ...extra1.cards,
    ...extra2.cards,
    ...extra3.cards,
    ...extra4.cards,
    ...q5part0.cards,
    ...q5part1.cards,
    ...q5part2.cards,
    ...q5part3.cards,
  ],
};
