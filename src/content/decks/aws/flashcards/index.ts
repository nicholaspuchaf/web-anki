import compute from './part-01.json' with { type: 'json' };
import services from './part-02.json' with { type: 'json' };

export default { ...compute, cards: [...compute.cards, ...services.cards] };
