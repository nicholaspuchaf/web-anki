import { CardActions } from '../../rework/CardActions';
import { StandardCard } from '../../standard/StandardCard';
import type { Card } from '../model';
import { LeetCodeCard } from '../../leetcode/components/LeetCodeCard';
import { MultipleChoiceCard } from '../../multiple-choice/components/MultipleChoiceCard';

export function CardPreview({
  card,
  reportable = true,
}: {
  card: Card;
  reportable?: boolean;
}) {
  if (card.faces) return <StandardCard card={card} reportable={reportable} />;
  if (card.multipleChoice)
    return <MultipleChoiceCard card={card} reportable={reportable} />;
  if (card.leetcode)
    return <LeetCodeCard card={card} reportable={reportable} />;
  return (
    <div className="flashcard">
      <h2>{card.front}</h2>
      <p className="preserve-text">{card.back}</p>
      <CardActions card={card} reportable={reportable} />
    </div>
  );
}
