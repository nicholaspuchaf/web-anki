import part0 from './x-window.json' with { type: 'json' };
import part1 from './x-wan.json' with { type: 'json' };
import part2 from './interfaces-remotas.json' with { type: 'json' };
import part3 from './cloud-gaming.json' with { type: 'json' };
import part4 from './aplicacoes-web.json' with { type: 'json' };
import part5 from './metricas-qoe.json' with { type: 'json' };
import part6 from './escolha-arquitetural.json' with { type: 'json' };
export default {
  ...part0,
  carousels: [
    ...part0.carousels,
    ...part1.carousels,
    ...part2.carousels,
    ...part3.carousels,
    ...part4.carousels,
    ...part5.carousels,
    ...part6.carousels,
  ],
};
