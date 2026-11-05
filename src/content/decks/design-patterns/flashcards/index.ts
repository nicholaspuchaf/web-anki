import creational from './creational.json' with { type: 'json' };
import structural from './structural.json' with { type: 'json' };
import behavioral from './behavioral.json' with { type: 'json' };

export default {
  ...creational,
  patterns: [
    ...creational.patterns,
    ...structural.patterns,
    ...behavioral.patterns,
  ],
};
