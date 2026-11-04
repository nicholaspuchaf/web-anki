import type { Card } from '../model';
import { LeetCodeCard } from '../../leetcode/components/LeetCodeCard';
import { MultipleChoiceCard } from '../../multiple-choice/components/MultipleChoiceCard';

export function CardPreview({ card }: { card: Card }) {
  if (card.multipleChoice) return <MultipleChoiceCard card={card} />;
  if (card.leetcode) return <LeetCodeCard card={card} />;
  return (
    <div className="flashcard">
      <h2>{card.front}</h2>
      <p className="preserve-text">{card.back}</p>
    </div>
  );
}
