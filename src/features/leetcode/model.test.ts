import { expect, test } from 'bun:test';
import {
  createLeetCode,
  normalizeTags,
  parseLeetCode,
  getAvailableFaces,
} from './model';
import { parseBackup } from '../backup/parse-backup';
import { putCard } from '../library/commands';
import { filterCards, emptyFilters } from '../library/filter-cards';
import type { Card, Library } from '../library/model';

const data = createLeetCode();
data.faces = data.faces.map((face, index) => ({
  ...face,
  content: `Conteúdo ${index}`,
}));
data.tags = ['hash map', 'array'];
data.url = 'https://leetcode.com/problems/two-sum/';
const card: Card = {
  id: 'c',
  deckId: 'd',
  front: 'Two Sum',
  back: '',
  due: 0,
  interval: 0,
  reviews: 0,
  favorite: true,
  leetcode: data,
};
const library: Library = {
  version: 1,
  decks: [{ id: 'd', name: 'LeetCode' }],
  cards: [card],
};

test('backup preserva versos, ordem, código, tags e aparência', () => {
  const restored = parseBackup(JSON.stringify(library));
  expect(restored).toEqual(library);
  expect(putCard(library, card).cards[0]).toEqual(card);
});

test('backup antigo permanece compatível', () => {
  const { leetcode: _, favorite: __, ...basic } = card;
  const old = { ...library, cards: [{ ...basic, back: 'Resposta antiga' }] };
  expect(parseBackup(JSON.stringify(old))).toEqual(old);
});

test('rejeita ids duplicados e URLs executáveis', () => {
  for (const invalid of [
    { ...data, url: 'javascript:alert(1)' },
    { ...data, faces: [data.faces[0], data.faces[0]] },
    { ...data, faces: [{ ...data.faces[0], kind: 'constructor' }] },
    { ...data, difficulty: 'unknown' },
    { ...data, tags: [5] },
  ]) {
    expect(() => parseLeetCode(invalid)).toThrow();
    expect(() =>
      parseBackup(
        JSON.stringify({ ...library, cards: [{ ...card, leetcode: invalid }] }),
      ),
    ).toThrow();
  }
});

test('combina busca, tags, favoritos e dificuldade sem alterar os cartões', () => {
  const filters = {
    ...emptyFilters,
    query: 'two',
    tag: 'hash map',
    favorites: true,
    difficulty: 'medium',
  };
  expect(filterCards([card], filters)).toEqual([card]);
  expect(filterCards([card], { ...filters, difficulty: 'hard' })).toEqual([]);
  expect(normalizeTags(' Array, array, HASH MAP, , ')).toEqual([
    'array',
    'hash map',
  ]);
  expect(card.leetcode?.tags).toEqual(['hash map', 'array']);
});

test('migra exemplos antigos para a pergunta e complexidade para um verso sem duplicar', () => {
  const legacy = {
    ...library,
    cards: [
      {
        ...card,
        leetcode: {
          ...data,
          examples: 'Entrada: [2,7], alvo 9\nSaída: [0,1]',
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)',
        },
      },
    ],
  };
  const restored = parseBackup(JSON.stringify(legacy));
  expect(restored.cards[0].front).toContain('Exemplos:\nEntrada: [2,7]');
  expect(restored.cards[0].leetcode?.faces.at(-1)).toMatchObject({
    kind: 'complexity',
    content: 'Tempo: O(n)\nEspaço: O(n)',
  });
  expect(restored.cards[0].leetcode).not.toHaveProperty('examples');
  expect(restored.cards[0].leetcode).not.toHaveProperty('timeComplexity');
  expect(parseBackup(JSON.stringify(restored))).toEqual(restored);
});

test('permite salvar e restaurar cartões sem versos ou com versos incompletos', () => {
  for (const faces of [
    [],
    createLeetCode().faces.map((face) => ({
      ...face,
      title: '',
      content: '   ',
    })),
  ]) {
    const draft = { ...card, leetcode: { ...data, faces } };
    const saved = putCard(library, draft);
    const restored = parseBackup(JSON.stringify(saved));
    expect(restored.cards[0].leetcode?.faces).toHaveLength(faces.length);
    expect(getAvailableFaces(restored.cards[0].leetcode!)).toEqual([]);
  }
  const basic = { ...card, leetcode: undefined, back: '' };
  const saved = putCard(library, basic);
  expect(parseBackup(JSON.stringify(saved)).cards[0].back).toBe('');
});

test('mantém os versos em branco no editor e apresenta só os preenchidos', () => {
  const draft = createLeetCode();
  draft.faces[2].content = 'return result';
  expect(parseLeetCode(draft).faces).toHaveLength(4);
  expect(getAvailableFaces(draft).map((face) => face.kind)).toEqual([
    'solution',
  ]);
});
