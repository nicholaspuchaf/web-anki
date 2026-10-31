import type { Card } from './model';
export type CardFilters = {
  query: string;
  tag: string;
  difficulty: string;
  favorites: boolean;
};
export const emptyFilters: CardFilters = {
  query: '',
  tag: '',
  difficulty: '',
  favorites: false,
};
export function filterCards(cards: Card[], filters: CardFilters): Card[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return cards.filter(
    (card) =>
      (!filters.favorites || card.favorite) &&
      (!filters.tag || card.leetcode?.tags.includes(filters.tag)) &&
      (!filters.difficulty ||
        card.leetcode?.difficulty === filters.difficulty) &&
      (!query ||
        [
          card.front,
          card.leetcode?.number ?? '',
          ...(card.leetcode?.tags ?? []),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query)),
  );
}
